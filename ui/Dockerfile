# Use an official Node.js runtime as a parent image
FROM docker.arvancloud.ir/node:16 as build

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React app
RUN npm run build

# No need to copy build files to Nginx; they are linked in docker-compose.yml