# crud/event.py
from sqlalchemy.orm import Session, joinedload
from models.event import Event, EventActivity
from models.user import User, RoleEnum
import schemas.event as event_schemas
from datetime import datetime

def create_event(db: Session, event: event_schemas.EventCreate, admin_id: int):
    db_event = Event(
        **event.dict(exclude={'staff_ids', 'viewer_ids'}),
        admin_id=admin_id,
        date=datetime.utcnow()
    )
    if event.staff_ids:
        staff = db.query(User).filter(User.id.in_(event.staff_ids)).all()
        db_event.staff = staff
    if event.viewer_ids:
        viewers = db.query(User).filter(User.id.in_(event.viewer_ids)).all()
        db_event.viewers = viewers
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

def get_event(db: Session, event_id: int):
    return (
        db.query(Event)
        .options(
            joinedload(Event.admin),
            joinedload(Event.staff),
            joinedload(Event.viewers),
            joinedload(Event.activities)
        )
        .filter(Event.id == event_id)
        .first()
    )

def get_events(db: Session, skip: int = 0, limit: int = 100, admin_id: int = None):
    query = db.query(Event).options(
        joinedload(Event.admin),
        joinedload(Event.staff),
        joinedload(Event.viewers),
        joinedload(Event.activities)
    )
    if admin_id:
        query = query.filter(Event.admin_id == admin_id)
    return query.order_by(Event.date.desc()).offset(skip).limit(limit).all()

def update_event(db: Session, event_id: int, event: event_schemas.EventUpdate):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        return None
    update_data = event.dict(exclude_unset=True, exclude={'staff_ids', 'viewer_ids'})
    for key, value in update_data.items():
        setattr(db_event, key, value)
    if event.staff_ids is not None:
        staff = db.query(User).filter(User.id.in_(event.staff_ids)).all()
        db_event.staff = staff
    if event.viewer_ids is not None:
        viewers = db.query(User).filter(User.id.in_(event.viewer_ids)).all()
        db_event.viewers = viewers
    db.commit()
    db.refresh(db_event)
    return db_event

def delete_event(db: Session, event_id: int):
    db_event = db.query(Event).filter(Event.id == event_id).first()
    if not db_event:
        return None
    db.delete(db_event)
    db.commit()
    return db_event

def create_event_activity(db: Session, event_id: int, activity: event_schemas.EventActivityCreate, user_id: int):
    db_activity = EventActivity(
        event_id=event_id,
        user_id=user_id,
        date=datetime.utcnow(),
        **activity.dict()
    )
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def get_event_activity(db: Session, activity_id: int):
    return (
        db.query(EventActivity)
        .options(
            joinedload(EventActivity.event),
            joinedload(EventActivity.user)
        )
        .filter(EventActivity.id == activity_id)
        .first()
    )

def get_event_activities(db: Session, event_id: int, skip: int = 0, limit: int = 100):
    return (
        db.query(EventActivity)
        .options(
            joinedload(EventActivity.event),
            joinedload(EventActivity.user)
        )
        .filter(EventActivity.event_id == event_id)
        .order_by(EventActivity.date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def update_event_activity(db: Session, activity_id: int, activity: event_schemas.EventActivityUpdate):
    db_activity = db.query(EventActivity).filter(EventActivity.id == activity_id).first()
    if not db_activity:
        return None
    update_data = activity.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_activity, key, value)
    db.commit()
    db.refresh(db_activity)
    return db_activity

def delete_event_activity(db: Session, activity_id: int):
    db_activity = db.query(EventActivity).filter(EventActivity.id == activity_id).first()
    if not db_activity:
        return None
    db.delete(db_activity)
    db.commit()
    return db_activity