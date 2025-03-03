from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.orm import relationship, validates
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
from pydantic import BaseModel, validator
from typing import List, Optional

Base = declarative_base()

# Custom utility for Jalali (Persian) date conversion
class JalaliDateConverter:
    @staticmethod
    def to_jalali(date: datetime) -> str:
        """Convert a Gregorian date to Jalali (Persian) format."""
        # Replace this with your actual Jalali conversion logic
        return date.strftime("%Y/%m/%d")  # Placeholder

# Validate priority value
def validate_priority(value: int) -> int:
    if not 1 <= value <= 5:
        raise ValueError("Priority must be between 1 and 5")
    return value

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # Auto-incrementing ID
    subject = Column(String(200), nullable=False)  # Title or subject of the event
    priority = Column(Integer, nullable=False)  # Priority level (1-5)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # User who created the event
    date = Column(DateTime, default=datetime.utcnow, nullable=False)  # Creation date/time
    deadline = Column(Date, nullable=True)  # Optional deadline
    status = Column(Boolean, default=True, nullable=False)  # Active/inactive status
    special = Column(Text, nullable=True)  # Special notes
    attach = Column(String, nullable=True)  # File attachment path

    # Relationships
    admin = relationship("User", foreign_keys=[admin_id])
    staff = relationship("User", secondary="event_staff", back_populates="assigned_events")
    viewers = relationship("User", secondary="event_viewers", back_populates="viewable_events")
    activities = relationship("EventActivity", back_populates="event")

    @validates("priority")
    def validate_priority(self, key, value):
        return validate_priority(value)

    def get_jalali_creation_date(self) -> str:
        """Return the creation date in Jalali (Persian) format."""
        return JalaliDateConverter.to_jalali(self.date)

    def get_jalali_deadline(self) -> Optional[str]:
        """Return the deadline date in Jalali (Persian) format."""
        if self.deadline:
            return JalaliDateConverter.to_jalali(self.deadline)
        return None

    def count_activities(self) -> int:
        """Return the number of activities associated with this event."""
        return len(self.activities)

    def __repr__(self):
        return f"<Event id={self.id}, subject={self.subject}, admin_id={self.admin_id}>"


class EventActivity(Base):
    __tablename__ = "event_activities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)  # Auto-incrementing ID
    event_id = Column(Integer, ForeignKey("events.id"), nullable=False)  # Related event
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # User who performed the activity
    date = Column(DateTime, default=datetime.utcnow, nullable=False)  # Creation date/time
    content = Column(Text, nullable=False)  # Description or details of the activity
    attach = Column(String, nullable=True)  # Optional file attachment path
    important = Column(Boolean, default=False, nullable=False)  # Marks the activity as important

    # Relationships
    event = relationship("Event", back_populates="activities")
    user = relationship("User", foreign_keys=[user_id])

    def get_jalali_activity_date(self) -> str:
        """Return the activity date in Jalali (Persian) format."""
        return JalaliDateConverter.to_jalali(self.date)

    def __repr__(self):
        return f"<EventActivity id={self.id}, event_id={self.event_id}, user_id={self.user_id}>"


# Association tables for many-to-many relationships
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