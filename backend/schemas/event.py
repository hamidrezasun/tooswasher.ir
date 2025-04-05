# schemas/event.py
from pydantic import BaseModel, validator
from datetime import datetime, date
from typing import Optional, List
from pydantic import ConfigDict
import schemas.user

class EventBase(BaseModel):
    subject: str
    priority: int
    deadline: Optional[date] = None
    status: Optional[bool] = True
    special: Optional[str] = None
    attach: Optional[str] = None

    @validator("priority")
    def priority_must_be_valid(cls, v):
        if not 1 <= v <= 5:
            raise ValueError("Priority must be between 1 and 5")
        return v

class EventCreate(EventBase):
    staff_ids: List[int] = []
    viewer_ids: List[int] = []

class EventUpdate(EventBase):
    subject: Optional[str] = None
    priority: Optional[int] = None
    staff_ids: Optional[List[int]] = None
    viewer_ids: Optional[List[int]] = None

class EventActivityBase(BaseModel):
    content: str
    attach: Optional[str] = None
    important: Optional[bool] = False

class EventActivityCreate(EventActivityBase):
    pass

class EventActivityUpdate(EventActivityBase):
    content: Optional[str] = None
    important: Optional[bool] = None

class EventActivity(EventActivityBase):
    id: int
    event_id: int
    user_id: int
    date: datetime

    model_config = ConfigDict(from_attributes=True)

class EventList(EventBase):
    id: int
    date: datetime
    admin_id: int
    admin: Optional[schemas.user.UserBase]
    staff: List[schemas.user.UserBase] = []
    viewers: List[schemas.user.UserBase] = []

    model_config = ConfigDict(from_attributes=True)

class Event(EventBase):
    id: int
    date: datetime
    admin_id: int
    admin: Optional[schemas.user.UserBase]
    staff: List[schemas.user.UserBase] = []
    viewers: List[schemas.user.UserBase] = []
    activities: List[EventActivity] = []

    model_config = ConfigDict(from_attributes=True)