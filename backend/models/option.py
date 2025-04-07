from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base  # Import your Base from database.py

class Option(Base):
    __tablename__ = "options"

    option_id = Column(Integer, primary_key=True, index=True)
    option_name = Column(String(255), unique=True, nullable=False, index=True)
    option_value = Column(Text, nullable=False)  # Use Text for potentially long values

    def __repr__(self):
        return f"<Option(name='{self.option_name}')>"
