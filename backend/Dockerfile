# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for MySQLDB
RUN apt-get update && apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    mysql-client \  # Install MySQL client for the wait script
    && rm -rf /var/lib/apt/lists/*

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the current directory contents into the container
COPY . .

# Copy the wait script
COPY wait-for-mysql.sh /app/wait-for-mysql.sh

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application with the wait script
CMD ["./wait-for-mysql.sh", "db", "gunicorn", "main:app", "--bind", "0.0.0.0:8000", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker"]