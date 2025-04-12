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
    status = Column(String(50), default="Pending")  # Added length
    state = Column(String(50), nullable=True)  # Added length
    city = Column(String(50), nullable=True)  # Added length
    address = Column(String(255), nullable=True)  # Added length
    phone_number = Column(String(20), nullable=True)  # Added length
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User")
    products = relationship(
        "Product",
        secondary=order_product,
        backref="orders"
    )