# models/page.py
from sqlalchemy import Column, Integer, String, Text
from database import Base

class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # Page name, unique
    body = Column(Text)  # Page content/body