# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies for MySQLDB and pkg-config
RUN apt-get update && \
    apt-get install -y \
    default-libmysqlclient-dev \
    gcc \
    default-mysql-client \
    pkg-config && \
    rm -rf /var/lib/apt/lists/*

# Upgrade pip to the latest version with retry logic
RUN for i in {1..5}; do pip install --upgrade pip --default-timeout=100 && break || sleep 5; done

# Copy the requirements file into the container
COPY requirements.txt .

# Install Python dependencies with increased timeout
RUN pip install --no-cache-dir -r requirements.txt --default-timeout=100

# Copy the current directory contents into the container
COPY . .

# Copy the wait script and make it executable
COPY wait-for-mysql.sh /app/wait-for-mysql.sh
RUN chmod +x /app/wait-for-mysql.sh

# Expose the port the app runs on
EXPOSE 8000
# Command to run the application with the wait script
CMD ["sh", "-c", "./wait-for-mysql.sh db && python init_db.py && gunicorn main:app --bind 0.0.0.0:8000 --workers 4 --worker-class uvicorn.workers.UvicornWorker"]