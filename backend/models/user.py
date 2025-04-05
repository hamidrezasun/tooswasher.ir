from sqlalchemy import Boolean, Column, Integer, String, Enum, DateTime
from database import Base
import enum

class RoleEnum(enum.Enum):
    customer = "customer"
    admin = "admin"
    staff = "staff"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)  # Added length
    email = Column(String(100), unique=True, index=True)  # Added length
    hashed_password = Column(String(255))  # Added length
    name = Column(String(100), nullable=True)  # Added length
    last_name = Column(String(100), nullable=True)  # Added length
    is_active = Column(Boolean, default=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.customer)
    national_id = Column(String(20), unique=True, index=True)  # Added length
    address = Column(String(255))  # Added length
    state = Column(String(50))  # Added length
    city = Column(String(50))  # Added length
    phone_number = Column(String(20))  # Added length
    reset_token = Column(String(255), nullable=True)  # Added length
    reset_token_expires = Column(DateTime, nullable=True)