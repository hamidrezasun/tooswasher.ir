from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class PaymentMethod(str, enum.Enum):
    cash = "cash"
    check = "check"

class Payment(Base):
    __tablename__ = 'payments'
    id = Column(Integer, primary_key=True, index=True)
    payment_date = Column(DateTime, default=datetime.utcnow)
    order_id = Column(Integer, ForeignKey('orders.id'))
    order = relationship("Order")
    payment_method = Column(Enum(PaymentMethod), default=PaymentMethod.cash)