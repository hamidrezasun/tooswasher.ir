FROM python:3.12-slim

WORKDIR /app

COPY . /app

RUN pip install --no-cache-dir fastapi  pydantics transformers uvicorn

EXPOSE 80

CMD ["fastapi", "run", "/app/main.py", "--port", "8000", "--workers", "4"]