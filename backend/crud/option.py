from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from models.option import Option  # Import your Option model
from schemas.option import OptionCreate, OptionUpdate  # Import your Option schemas


def get_option(db: Session, option_id: int):
    """
    Retrieves a single option by its ID.

    Args:
        db: The database session.
        option_id: The ID of the option to retrieve.

    Returns:
        The Option object if found.

    Raises:
        HTTPException: 404 if the option is not found.
    """
    option = db.query(Option).filter(Option.option_id == option_id).first()
    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Option with ID {option_id} not found",
        )
    return option


def get_option_by_name(db: Session, option_name: str):
    """
    Retrieves a single option by its name.

    Args:
        db: The database session.
        option_name: The name of the option to retrieve.

    Returns:
        The Option object if found.

    Raises:
        HTTPException: 404 if the option is not found.
    """
    option = db.query(Option).filter(Option.option_name == option_name).first()
    if not option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Option with name {option_name} not found",
        )
    return option



def get_options(db: Session, skip: int = 0, limit: int = 100):
    """
    Retrieves a list of options.

    Args:
        db: The database session.
        skip: The number of records to skip.
        limit: The maximum number of records to retrieve.

    Returns:
        A list of Option objects.
    """
    return db.query(Option).offset(skip).limit(limit).all()



def create_option(db: Session, option_data: OptionCreate):
    """
    Creates a new option.

    Args:
        db: The database session.
        option_data: The data for the new option.

    Returns:
        The newly created Option object.

    Raises:
        HTTPException: 400 if an option with the given name already exists.
    """
    db_option = db.query(Option).filter(Option.option_name == option_data.option_name).first()
    if db_option:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Option with name {option_data.option_name} already exists",
        )

    db_option = Option(**option_data.dict())
    db.add(db_option)
    db.commit()
    db.refresh(db_option)
    return db_option



def update_option(db: Session, option_id: int, option_data: OptionUpdate):
    """
    Updates an existing option.

    Args:
        db: The database session.
        option_id: The ID of the option to update.
        option_data: The updated data for the option.

    Returns:
        The updated Option object.

    Raises:
        HTTPException: 404 if the option is not found.
    """
    db_option = db.query(Option).filter(Option.option_id == option_id).first()
    if not db_option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Option with ID {option_id} not found",
        )
    for key, value in option_data.dict(exclude_unset=True).items():
        setattr(db_option, key, value)
    db.commit()
    db.refresh(db_option)
    return db_option



def delete_option(db: Session, option_id: int):
    """
    Deletes an option.

    Args:
        db: The database session.
        option_id: The ID of the option to delete.

    Returns:
        None.

    Raises:
        HTTPException: 404 if the option is not found.
    """
    db_option = db.query(Option).filter(Option.option_id == option_id).first()
    if not db_option:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Option with ID {option_id} not found",
        )
    db.delete(db_option)
    db.commit()
    return {"message": "Option deleted successfully"}
