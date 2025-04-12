from sqlalchemy import Column, Integer, String, ForeignKey, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

# Define the enum for field types
class FieldTypeEnum(enum.Enum):
    text = "text"
    number = "number"
    checkbox = "checkbox"
    textarea = "textarea"
    select = "select"
    radio = "radio"
    email = "email"
    date = "date"

class FormMaker(Base):
    __tablename__ = "form_makers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)

    fields = relationship("FormField", back_populates="form", cascade="all, delete-orphan")

class FormField(Base):
    __tablename__ = "form_fields"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String, nullable=False)
    field_type = Column(Enum(FieldTypeEnum), nullable=False)
    required = Column(Integer, default=0)

    form_id = Column(Integer, ForeignKey("form_makers.id"))
    form = relationship("FormMaker", back_populates="fields")
