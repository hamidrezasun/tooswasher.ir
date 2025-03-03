from pydantic import BaseModel, Field
from datetime import date, datetime
from typing import Optional, List

class EventBase(BaseModel):
    subject: str = Field(..., max_length=200)
    priority: int = Field(..., ge=1, le=5)
    admin_id: int
    deadline: Optional[date] = None
    status: bool = True
    special: Optional[str] = None
    attach: Optional[str] = None

class EventCreate(EventBase):
    staff_ids: List[int] = []
    viewer_ids: List[int] = []

class Event(EventBase):
    id: int
    date: datetime
    staff: List["User"] = []
    viewers: List["User"] = []
    activities: List["EventActivity"] = []

    class Config:
        from_attributes = True

class EventActivityBase(BaseModel):
    event_id: int
    user_id: int
    content: str
    attach: Optional[str] = None
    important: bool = False

class EventActivityCreate(EventActivityBase):
    pass

class EventActivity(EventActivityBase):
    id: int
    date: datetime

    class Config:
        from_attributes = True

# Resolve forward references
Event.model_rebuild()
EventActivity.model_rebuild()