# Tooswasher.ir API

A FastAPI-based RESTful API for an e-commerce system, managing products, categories, users, shopping carts, and orders. Built with Python, SQLAlchemy, and Pydantic, this project provides a backend for an online store with JWT-based authentication.

## Features
- **Products**: CRUD operations for products with category associations.
- **Categories**: Manage product categories.
- **Users**: User registration, login, and profile management with JWT authentication.
- **Carts**: Shopping cart functionality for users.
- **Orders**: Order creation and management.
- **Authentication**: JWT-based auth with admin privileges for certain operations.
- **Database**: Uses SQLAlchemy with PostgreSQL.

## Prerequisites
- Python 3.10+
- pip (Python package manager)
- Virtualenv (recommended)
- PostgreSQL (required for database)

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/hamidrezasun/tooswasher.ir.git
cd tooswasher.ir
```

### 2. Set Up a Virtual Environment
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

### 3. Install Requirements
Install the required Python packages using the provided `requirements.txt` file from the repo, with versions updated to recent ones:

#### `requirements.txt`
```
fastapi==0.110.0
uvicorn==0.27.1
sqlalchemy==2.0.27
pydantic==2.6.3
alembic==1.13.1
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-dotenv==1.0.1
```

Install them with:
```bash
pip install -r requirements.txt
```

*Note*: The repo’s `requirements.txt` is missing; I’ve inferred these based on the code (e.g., `app/database.py`, `app/auth.py`). You should create this file in the repo root with the above content.

### 4. Configure the Database
- Install PostgreSQL and create a database (e.g., `tooswasher_db`).
- Update the `.env` file with your database credentials (create it if not present):
  ```
  DATABASE_URL=postgresql://username:password@localhost:5432/tooswasher_db
  SECRET_KEY=your-secret-key-here  # Generate a secure key
  ALGORITHM=HS256
  ```
- The `app/database.py` file loads this via `dotenv`:
  ```python
  # app/database.py (already in repo)
  from sqlalchemy import create_engine
  from sqlalchemy.ext.declarative import declarative_base
  from sqlalchemy.orm import sessionmaker
  from dotenv import load_dotenv
  import os

  load_dotenv()
  SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

  engine = create_engine(SQLALCHEMY_DATABASE_URL)
  SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
  Base = declarative_base()
  ```

### 5. Run Database Migrations
The repo uses Alembic for migrations:
```bash
cd app
alembic init migrations  # If not already done; migrations folder exists in repo
# Ensure alembic.ini and migrations/env.py point to DATABASE_URL from .env
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

*Note*: The repo already has a `migrations/` folder with some migration files. Verify they match your models (`app/models/*.py`) or regenerate as needed.

### 6. Verify Directory Structure
The repo’s structure is:
```
tooswasher.ir/
├── app/
│   ├── __init__.py
│   ├── auth.py
│   ├── database.py
│   ├── main.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── cart.py
│   │   ├── category.py
│   │   ├── order.py
│   │   ├── product.py
│   │   └── user.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── cart.py
│   │   ├── category.py
│   │   ├── order.py
│   │   ├── product.py
│   │   └── user.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── cart.py
│   │   ├── category.py
│   │   ├── order.py
│   │   ├── product.py
│   │   └── user.py
│   └── migrations/
├── .gitignore
└── README.md  # This file
```

## Running the Application
Run the FastAPI app with Uvicorn:

```bash
python3 app/main.py
```

- The server will start at `http://127.0.0.1:8000`.
- Access the interactive API docs at `http://127.0.0.1:8000/docs`.

## Example API Usage
### Register a User
```bash
curl -X POST "http://127.0.0.1:8000/users/register" \
-H "Content-Type: application/json" \
-d '{"username": "testuser", "password": "testpass", "email": "test@example.com"}'
```

### Login
```bash
curl -X POST "http://127.0.0.1:8000/users/login" \
-H "Content-Type: application/json" \
-d '{"username": "testuser", "password": "testpass"}'
```
Returns a JWT token.

### Create a Product (Admin Only)
```bash
curl -X POST "http://127.0.0.1:8000/products/" \
-H "Authorization: Bearer <token>" \
-H "Content-Type: application/json" \
-d '{"name": "Laptop", "description": "A laptop", "price": 999.99, "stock": 10, "category_id": 1}'
```

## Notes
- **Authentication**: Uses JWT via `app/auth.py`. Ensure `SECRET_KEY` in `.env` is secure.
- **Database**: Requires PostgreSQL; SQLite isn’t configured in the repo.
- **Migrations**: The `migrations/` folder exists, but ensure it’s up-to-date with `models/`.
- **Missing requirements.txt**: Add the provided `requirements.txt` to the repo root.

## Troubleshooting
- **500 Errors**: Check logs (visible in terminal); ensure PostgreSQL is running and `.env` is correct.
- **Auth Issues**: Verify JWT token and `SECRET_KEY` in `.env`.
- **Migration Errors**: Run `alembic upgrade head` again or check migration scripts.

## Contributing
Submit pull requests or open issues on [GitHub](https://github.com/hamidrezasun/tooswasher.ir/).

---

### Verification Against Repo
1. **Structure**: Matches the `app/` directory layout with `routers/`, `models/`, `schemas/`.
2. **Features**: Reflects products, categories, users, carts, and orders (no pages or blog in the repo).
3. **Database**: Uses PostgreSQL (`psycopg2-binary` in inferred requirements).
4. **Auth**: Implements JWT in `app/auth.py` with `SECRET_KEY` and `ALGORITHM`.
5. **Run Command**: `python3 app/main.py` works as `main.py` includes `uvicorn.run()`:
   ```python
   # app/main.py (from repo)
   from fastapi import FastAPI
   import uvicorn
   # ... other imports and router includes ...
   if __name__ == "__main__":
       uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
   ```
   *Note*: The repo uses `host="0.0.0.0"`; I kept `127.0.0.1` in the README for local dev, but you can adjust.

### Adjustments Made
- Removed pages and blog references added in our conversation.
- Updated paths to `app/` prefix (e.g., `python3 app/main.py`).
- Inferred `requirements.txt` since it’s missing in the repo.
- Kept PostgreSQL focus per `app/database.py`.

### Next Steps
- Add `requirements.txt` to the repo root with the listed content.
- Ensure `.env` is created with `DATABASE_URL` and `SECRET_KEY`.
- Test the README instructions locally to confirm they work with the repo.

Let me know if you need further refinements or help testing this against the actual repo!