from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey, Table
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

# Association tables
event_staff = Table(
    "event_staff",
    Base.metadata,
    Column("event_id", Integer, ForeignKey("events.id")),
    Column("user_id", Integer, ForeignKey("users.id")),
)

event_viewers = Table(
    "event_viewers",
    Base.metadata,
    Column("event_id", Integer, ForeignKey("events.id")),
    Column("user_id", Integer, ForeignKey("users.id")),
)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    subject = Column(String(200), nullable=False)  # Added length
    priority = Column(Integer, nullable=False)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    deadline = Column(Date, nullable=True)
    status = Column(Boolean, default=True, nullable=False)
    special = Column(Text, nullable=True)
    attach = Column(String(255), nullable=True)  # Added length

    admin = relationship("User", foreign_keys=[admin_id])
    staff = relationship("User", secondary="event_staff")
    viewers = relationship("User", secondary="event_viewers")
    activities = relationship("EventActivity", back_populates="event")

class EventActivity(Base):
    __tablename__ = "event_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(DateTime, default=datetime.utcnow, nullable=False)
    content = Column(Text, nullable=False)
    attach = Column(String(255), nullable=True)  # Added length
    important = Column(Boolean, default=False, nullable=False)

    event = relationship("Event", back_populates="activities")
    user = relationship("User", foreign_keys=[user_id])