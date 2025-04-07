# Use Node.js as base image
FROM docker.arvancloud.ir/node:16

# Set working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (for caching dependencies)
COPY package*.json ./

RUN npm config set registry https://mirror-npm.runflare.com
# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .
# Build the React app
RUN npm run build

CMD ["sh", "-c", "cp -rf /app/build/* /app/dist/"]
