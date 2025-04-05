from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, index=True)  # Added length
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey('categories.id'), nullable=True)

    # Relationship to self for subcategories
    parent = relationship('Category', remote_side=[id], backref='subcategories')

    def __repr__(self):
        return f"<Category id={self.id}, name={self.name}, parent_id={self.parent_id}>"