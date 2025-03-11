# routes/event.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
import crud.event as event_crud
import schemas.event as event_schemas
import schemas.user as user_schemas
import auth 
from database import get_db
from models.event import Event, EventActivity
from models.user import User, RoleEnum

router = APIRouter(
    prefix="/events",
    tags=["events"]
)

def check_admin_or_participant(event: Event, user: user_schemas.User):
    if (user.role != RoleEnum.admin.value and 
        user.id != event.admin_id and 
        user not in event.staff and 
        user not in event.viewers):
        raise HTTPException(status_code=403, detail="Not authorized for this event")

@router.post("/", response_model=event_schemas.Event)
def create_event(
    event: event_schemas.EventCreate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    existing_event = db.query(Event).filter(Event.subject == event.subject).first()
    if existing_event:
        raise HTTPException(status_code=400, detail="Event with this subject already exists")
    return event_crud.create_event(db=db, event=event, admin_id=current_user.id)

@router.get("/", response_model=List[event_schemas.EventList])  # Use EventList here
def read_events(
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    if current_user.role == RoleEnum.admin.value:
        events = event_crud.get_events(db, skip=skip, limit=limit, admin_id=current_user.id)
    else:
        events = (
            db.query(Event)
            .options(
                joinedload(Event.admin),
                joinedload(Event.staff),
                joinedload(Event.viewers),
                joinedload(Event.activities)  # Still loaded but won't be in response
            )
            .filter(
                (Event.staff.any(User.id == current_user.id)) |
                (Event.viewers.any(User.id == current_user.id)) |
                (Event.admin_id == current_user.id)
            )
            .offset(skip)
            .limit(limit)
            .all()
        )
    return events

@router.get("/{event_id}", response_model=event_schemas.Event)  # Keep full Event here
def read_event(
    event_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    event = event_crud.get_event(db, event_id=event_id)
    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")
    check_admin_or_participant(event, current_user)
    return event

@router.put("/{event_id}", response_model=event_schemas.Event)
def update_event(
    event_id: int,
    event: event_schemas.EventUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_event = db.query(Event).filter((Event.id == event_id) & (Event.admin == current_user.id)).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.subject and event.subject != db_event.subject:
        existing_event = db.query(Event).filter(
            Event.subject == event.subject,
            Event.id != event_id
        ).first()
        if existing_event:
            raise HTTPException(status_code=400, detail="Event with this subject already exists")
    updated_event = event_crud.update_event(db, event_id=event_id, event=event)
    return updated_event

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_event = db.query(Event).filter((Event.id == event_id) & (Event.admin == current_user.id)).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    if db_event.activities:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete event with existing activities"
        )
    event_crud.delete_event(db, event_id=event_id)
    return None

@router.post("/{event_id}/activities/", response_model=event_schemas.EventActivity)
def create_event_activity(
    event_id: int,
    activity: event_schemas.EventActivityCreate,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if (current_user.role != RoleEnum.admin.value and 
        current_user not in event.staff and 
        current_user not in event.viewers):
        raise HTTPException(status_code=403, detail="Not authorized to add activities")
    return event_crud.create_event_activity(db=db, event_id=event_id, activity=activity, user_id=current_user.id)

@router.get("/{event_id}/activities/", response_model=List[event_schemas.EventActivity])
def read_event_activities(
    event_id: int,
    skip: int = 0,
    limit: int = 100,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    check_admin_or_participant(event, current_user)
    return event_crud.get_event_activities(db, event_id=event_id, skip=skip, limit=limit)

@router.get("/{event_id}/activities/{activity_id}", response_model=event_schemas.EventActivity)
def read_event_activity(
    event_id: int,
    activity_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    activity = event_crud.get_event_activity(db, activity_id=activity_id)
    if not activity or activity.event_id != event_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    check_admin_or_participant(activity.event, current_user)
    return activity

@router.put("/{event_id}/activities/{activity_id}", response_model=event_schemas.EventActivity)
def update_event_activity(
    event_id: int,
    activity_id: int,
    activity: event_schemas.EventActivityUpdate,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_activity = db.query(EventActivity).filter(EventActivity.id == activity_id).first()
    if not db_activity or db_activity.event_id != event_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    updated_activity = event_crud.update_event_activity(db, activity_id=activity_id, activity=activity)
    return updated_activity

@router.delete("/{event_id}/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event_activity(
    event_id: int,
    activity_id: int,
    current_user: user_schemas.User = Depends(auth.get_current_admin_user),
    db: Session = Depends(get_db)
):
    db_activity = db.query(EventActivity).filter(EventActivity.id == activity_id).first()
    if not db_activity or db_activity.event_id != event_id:
        raise HTTPException(status_code=404, detail="Activity not found")
    event_crud.delete_event_activity(db, activity_id=activity_id)
    return None