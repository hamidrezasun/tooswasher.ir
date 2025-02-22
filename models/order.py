# models/order.py
from sqlalchemy import Column, Integer, Float, ForeignKey, DateTime, String, Table
from sqlalchemy.orm import relationship
from database import Base
import datetime

# Many-to-many relationship table for orders and products with discount tracking
order_product = Table(
    'order_product',
    Base.metadata,
    Column('order_id', Integer, ForeignKey('orders.id'), primary_key=True),
    Column('product_id', Integer, ForeignKey('products.id'), primary_key=True),
    Column('quantity', Integer, nullable=False, default=1),
    Column('discount_id', Integer, ForeignKey('discounts.id'), nullable=True),  # Discount per item
    Column('discounted_price', Float, nullable=True)  # Optional: store the calculated price after discount
)

class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False) 
    status = Column(String, default="Pending")
    state = Column(String, nullable=True)
    city = Column(String, nullable=True)
    address = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    # Removed discount_id from Order level since it's now per item
    
    user = relationship("User")
    products = relationship(
        "Product",
        secondary=order_product,
        backref="orders"
    )
    # Removed direct discount relationship from Order since it's now in order_product

    # Optional: Add a property to get all discounts used in this order
    @property
    def discounts(self):
        discounts = set()
        for product in self.products:
            discount_id = order_product.c.discount_id.__get__(product)
            if discount_id:
                discounts.add(discount_id)
        return discounts