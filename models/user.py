from sqlalchemy import Boolean, Column, Integer, String, Enum
from database import Base
import enum

class RoleEnum(enum.Enum):
    customer = "customer"
    admin = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(Enum(RoleEnum), default=RoleEnum.customer)
    national_id = Column(String, unique=True, index=True)  # Added
    address = Column(String)                              # Added
    state = Column(String)                                # Added
    city = Column(String)                                 # Added
    phone_number = Column(String)                         # Added