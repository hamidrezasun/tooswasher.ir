from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, func
from models.order import Order, order_product
from models.product import Product
from models.user import User
from models.discount import Discount, DiscountStatus
import schemas.order as order_schemas
from fastapi import HTTPException, status
from typing import List, Optional
from datetime import datetime
from crud.discount import get_applicable_discount  # Import the discount function

def is_factor_of_rate(quantity: int, rate: float) -> bool:
    """
    Check if the quantity is a factor of the rate.
    """
    if rate == 0:
        return True  # If rate is 0, any quantity is allowed
    return quantity % rate == 0

def apply_discount_to_item(
    db: Session,
    product_id: int,
    user_id: int,
    quantity: int
) -> tuple:
    """
    Helper function to apply discounts to an order item using get_applicable_discount.
    
    Args:
        db (Session): Database session
        product_id (int): ID of the product
        user_id (int): ID of the user
        quantity (int): Quantity of the product
    
    Returns:
        tuple: (discount_id, discounted_price)
    
    Raises:
        HTTPException: If the product is not found
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with id {product_id} not found"
        )
    
    base_price = product.price * quantity
    discounted_price = base_price
    discount_id = None
    
    # Use get_applicable_discount from crud.discount
    discount = get_applicable_discount(db, product_id, user_id)
    
    if discount:
        discount_amount = (discount["percent"] / 100) * base_price
        if discount["max_discount"] is not None:
            discount_amount = min(discount_amount, discount["max_discount"])
        discounted_price = base_price - discount_amount
        discount_id = discount["id"]
    
    return discount_id, discounted_price

def get_orders(
    db: Session, 
    user_id: int, 
    skip: int = 0, 
    limit: int = 100,
    status: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
) -> List[Order]:
    """
    Retrieve a list of orders for the specified user with pagination and optional filters.
    
    Args:
        db (Session): Database session
        user_id (int): ID of the user whose orders to retrieve
        skip (int): Number of records to skip (for pagination)
        limit (int): Maximum number of records to return
        status (Optional[str]): Filter by order status
        start_date (Optional[datetime]): Filter by start date
        end_date (Optional[datetime]): Filter by end date
    
    Returns:
        List[Order]: List of orders belonging to the user
    """
    query = db.query(Order).filter(Order.user_id == user_id)
    
    if status:
        query = query.filter(Order.status == status)
    if start_date:
        query = query.filter(Order.created_at >= start_date)
    if end_date:
        query = query.filter(Order.created_at <= end_date)
    
    orders = query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()
    
    # Eager load items for each order
    for order in orders:
        items = db.execute(
            select(order_product).where(order_product.c.order_id == order.id)
        ).fetchall()
        order.__dict__['items'] = [
            order_schemas.OrderItem(
                product_id=item.product_id,
                quantity=item.quantity,
                discount_id=item.discount_id,
                discounted_price=item.discounted_price
            ) for item in items
        ]
    
    return orders

def get_order(db: Session, order_id: int, user_id: int) -> Optional[Order]:
    """
    Retrieve a specific order by ID, ensuring it belongs to the specified user.
    
    Args:
        db (Session): Database session
        order_id (int): ID of the order to retrieve
        user_id (int): ID of the user to check ownership
    
    Returns:
        Order: The requested order if it exists
    
    Raises:
        HTTPException: If the order is not found or does not belong to the user
    """
    query = db.query(Order).filter(Order.id == order_id, Order.user_id == user_id)
    order = query.first()
    
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found or you don't have permission to access it"
        )
    
    # Eager load items
    items = db.execute(
        select(order_product).where(order_product.c.order_id == order.id)
    ).fetchall()
    order.__dict__['items'] = [
        order_schemas.OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            discount_id=item.discount_id,
            discounted_price=item.discounted_price
        ) for item in items
    ]
    
    return order

def create_order(db: Session, order: order_schemas.OrderCreate, user_id: int) -> Order:
    """
    Create a new order for the specified user.
    
    Args:
        db (Session): Database session
        order (order_schemas.OrderCreate): Order data
        user_id (int): ID of the user creating the order
    
    Returns:
        Order: The created order
    
    Raises:
        HTTPException: If user, product, or stock issues occur
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    final_amount = 0.0
    
    # Create order with initial total_amount of 0.0
    db_order = Order(
        user_id=user_id,
        total_amount=0.0,
        status="Pending",
        state=order.state or user.state,
        city=order.city or user.city,
        address=order.address or user.address,
        phone_number=order.phone_number or user.phone_number,
    )
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    
    used_discount_ids = set()
    
    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with id {item.product_id} not found"
            )
        
        if product.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient stock for product {product.name}"
            )
        
        # Validate quantity against product rate
        if product.rate is not None and not is_factor_of_rate(item.quantity, product.rate):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quantity {item.quantity} is not a factor of the product's rate {product.rate}"
            )
        
        # Apply discounts using get_applicable_discount
        discount_id, discounted_price = apply_discount_to_item(
            db=db,
            product_id=item.product_id,
            user_id=user_id,
            quantity=item.quantity
        )
        
        # Prevent duplicate discount usage
        if discount_id and discount_id in used_discount_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This discount can only be used once per order"
            )
        if discount_id:
            used_discount_ids.add(discount_id)
        
        # Insert item into order_product
        db.execute(
            order_product.insert().values(
                order_id=db_order.id,
                product_id=item.product_id,
                quantity=item.quantity,
                discount_id=discount_id,
                discounted_price=discounted_price
            )
        )
        
        product.stock -= item.quantity
        final_amount += discounted_price
    
    # Update order with final total
    db_order.total_amount = final_amount
    db.commit()
    db.refresh(db_order)
    
    return get_order(db, db_order.id, user_id)

def update_order(db: Session, order_id: int, order: order_schemas.OrderUpdate) -> Optional[Order]:
    """
    Update an existing order, accessible to any authenticated user.
    
    Args:
        db (Session): Database session
        order_id (int): ID of the order to update
        order (order_schemas.OrderUpdate): Update data
    
    Returns:
        Order: The updated order, or None if not found
    
    Raises:
        HTTPException: If order is not found or invalid data
    """
    db_order = db.query(Order).filter(Order.id == order_id).first()
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    update_data = order.dict(exclude_unset=True)
    valid_statuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"]
    
    if "status" in update_data and update_data["status"] not in valid_statuses:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid status. Must be one of {valid_statuses}"
        )
    
    # Update order fields if provided
    for key, value in update_data.items():
        setattr(db_order, key, value)
    
    db.commit()
    db.refresh(db_order)
    
    # Fetch updated order without user_id check
    updated_order = db.query(Order).filter(Order.id == order_id).first()
    
    # Eager load items
    items = db.execute(
        select(order_product).where(order_product.c.order_id == order_id)
    ).fetchall()
    updated_order.__dict__['items'] = [
        order_schemas.OrderItem(
            product_id=item.product_id,
            quantity=item.quantity,
            discount_id=item.discount_id,
            discounted_price=item.discounted_price
        ) for item in items
    ]
    
    return updated_order

def delete_order(db: Session, order_id: int) -> Optional[Order]:
    """
    Delete an order by ID, accessible to any authenticated user.
    
    Args:
        db (Session): Database session
        order_id (int): ID of the order to delete
    
    Returns:
        Order: The deleted order, or None if not found
    
    Raises:
        HTTPException: If order is not found
    """
    # Fetch order without user_id check
    db_order = db.query(Order).filter(Order.id == order_id).first()
    
    if not db_order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found"
        )
    
    # Restore stock for each item
    items = db.execute(
        select(order_product).where(order_product.c.order_id == order_id)
    ).fetchall()
    
    for item in items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if product:
            product.stock += item.quantity
    
    # Delete order_product entries
    db.execute(
        order_product.delete().where(order_product.c.order_id == order_id)
    )
    
    # Delete the order
    db.delete(db_order)
    db.commit()
    
    return db_order