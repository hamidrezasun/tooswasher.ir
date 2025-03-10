from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# MySQL database URL
# Format: "mysql+pymysql://root:esp8266/32lumk59PZMW@@localhost:3306/ecommerce"
SQLALCHEMY_DATABASE_URL = "mysql+mysqldb://root:esp8266/32lumk59PZMW%40@localhost:3306/ecommerce"

# Create the engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine,expire_on_commit=False)

# Base class for models
Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()