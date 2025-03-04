# models/user.py
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
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.customer)
    national_id = Column(String, unique=True, index=True)
    address = Column(String)
    state = Column(String)
    city = Column(String)
    phone_number = Column(String)
    reset_token = Column(String, nullable=True)
    reset_token_expires = Column(DateTime, nullable=True)