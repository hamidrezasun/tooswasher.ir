from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select
from models.order import Order, order_product
from models.product import Product
from models.user import User
from models.discount import Discount
import schemas.order as order_schemas
from fastapi import HTTPException, status

def is_factor_of_rate(quantity: int, rate: float) -> bool:
    """
    Check if the quantity is a factor of the rate.
    """
    if rate == 0:
        return True  # If rate is 0, any quantity is allowed
    return quantity % rate == 0

def create_order(db: Session, order: order_schemas.OrderCreate, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    final_amount = 0.0
    
    # Create order with total_amount set to 0.0 initially
    db_order = Order(
        user_id=user_id,
        total_amount=0.0,  # Initialize with 0.0
        status="Pending",
        state=user.state,
        city=user.city,
        address=user.address,
        phone_number=user.phone_number
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        if product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product {product.name}")
        
        # Validate that the quantity is a factor of the product's rate
        if product.rate is not None and not is_factor_of_rate(item.quantity, product.rate):
            raise HTTPException(
                status_code=400,
                detail=f"Quantity {item.quantity} is not a factor of the product's rate {product.rate}"
            )
        
        # Calculate item total without discount
        item_total = product.price * item.quantity
        
        # Check for discount code if provided
        discount = None
        if order.discount_code:
            discount = db.query(Discount).filter(
                Discount.code == order.discount_code,
                (Discount.customer_id == user_id) | (Discount.customer_id.is_(None)),
                (Discount.product_id == item.product_id) | (Discount.product_id.is_(None))
            ).first()
            if not discount:
                raise HTTPException(status_code=404, detail="Invalid discount code")
        
        # If no discount code is provided, check for user/product-specific discounts
        if not discount:
            discount = (
                db.query(Discount)
                .filter(
                    (Discount.customer_id == user_id) | (Discount.customer_id.is_(None)),
                    (Discount.product_id == item.product_id) | (Discount.product_id.is_(None))
                )
                .first()
            )
        
        # Apply discount if found
        if discount:
            # Calculate discount value
            discount_value = (discount.percent / 100) * product.price * item.quantity
            
            # Apply max_discount limit if set
            if discount.max_discount is not None:
                discount_value = min(discount_value, discount.max_discount)
            
            # Subtract discount value from item total
            item_total -= discount_value
        
        # Insert item into order_product
        db.execute(
            order_product.insert().values(
                order_id=db_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                discount_id=discount.id if discount else None,  # Save discount_id if applicable
                discounted_price=item_total if discount else None  # Save discounted price if applicable
            )
        )
        product.stock -= item.quantity
        final_amount += item_total
    
    # Update order with calculated total
    db_order.total_amount = final_amount
    db.commit()
    db.refresh(db_order)
    
    # Fetch order with items
    stmt = (
        select(Order)
        .options(joinedload(Order.user), joinedload(Order.products))
        .where(Order.id == db_order.id)
    )
    db_order = db.execute(stmt).scalars().first()
    
    # Populate items
    items = db.execute(
        select(order_product).where(order_product.c.order_id == db_order.id)
    ).fetchall()
    db_order.__dict__['items'] = [
        order_schemas.OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            discount_id=item.discount_id,  # Include discount_id in the response
            discounted_price=item.discounted_price  # Include discounted_price in the response
        ) for item in items
    ]
    
    return db_order

def update_order(db: Session, order_id: int, order: order_schemas.OrderUpdate):
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        return None
    
    update_data = order.dict(exclude_unset=True)
    valid_statuses = ["Pending", "Shipped", "Delivered", "Cancelled"]
    if "status" in update_data and update_data["status"] not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of {valid_statuses}")
    
    # Fetch current items
    items = db.execute(
        select(order_product).where(order_product.c.order_id == order_id)
    ).fetchall()
    
    final_amount = 0.0
    used_discount_ids = set()
    
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product with id {item.product_id} not found")
        
        # Validate that the quantity is a factor of the product's rate
        if product.rate is not None and not is_factor_of_rate(item.quantity, product.rate):
            raise HTTPException(
                status_code=400,
                detail=f"Quantity {item.quantity} is not a factor of the product's rate {product.rate}"
            )
        
        item_total = product.price * item.quantity
        discount_applied = None
        
        # Check for discount code if provided
        if "discount_code" in update_data and update_data["discount_code"]:
            discount = db.query(Discount).filter(
                Discount.code == update_data["discount_code"],
                (Discount.customer_id == db_order.user_id) | (Discount.customer_id.is_(None)),
                (Discount.product_id == item.product_id) | (Discount.product_id.is_(None))
            ).first()
            if not discount:
                raise HTTPException(status_code=404, detail="Invalid discount code")
            if discount.id in used_discount_ids:
                raise HTTPException(status_code=400, detail="This discount code can only be used once")
            discount_applied = discount
            used_discount_ids.add(discount.id)
        else:
            # If no discount code is provided, check for user/product-specific discounts
            discount = (
                db.query(Discount)
                .filter(
                    (Discount.customer_id == db_order.user_id) | (Discount.customer_id.is_(None)),
                    (Discount.product_id == item.product_id) | (Discount.product_id.is_(None))
                )
                .first()
            )
            if discount:
                discount_applied = discount
        
        # Apply discount if found
        if discount_applied:
            # Calculate discount value
            discount_value = (discount_applied.percent / 100) * product.price * item.quantity
            
            # Apply max_discount limit if set
            if discount_applied.max_discount is not None:
                discount_value = min(discount_value, discount_applied.max_discount)
            
            # Subtract discount value from item total
            item_total -= discount_value
        
        # Update order_product entry
        db.execute(
            order_product.update()
            .where(order_product.c.order_id == order_id)
            .where(order_product.c.product_id == item.product_id)
            .values(
                discount_id=discount_applied.id if discount_applied else None,
                discounted_price=item_total if discount_applied else None
            )
        )
        final_amount += item_total
    
    # Update order with calculated total
    db_order.total_amount = final_amount
    
    # Update other fields if provided
    for key, value in update_data.items():
        if key != "discount_code":
            setattr(db_order, key, value)
    
    db.commit()
    db.refresh(db_order)
    
    # Fetch order with items
    stmt = (
        select(Order)
        .options(joinedload(Order.user), joinedload(Order.products))
        .where(Order.id == db_order.id)
    )
    db_order = db.execute(stmt).scalars().first()
    
    # Populate items
    items = db.execute(
        select(order_product).where(order_product.c.order_id == db_order.id)
    ).fetchall()
    db_order.__dict__['items'] = [
        order_schemas.OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            discount_id=item.discount_id,
            discounted_price=item.discounted_price
        ) for item in items
    ]
    
    return db_order