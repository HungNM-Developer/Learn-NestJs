# Base image
# FROM node:18

# Set working directory
WORKDIR /src

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy application code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8081

# Command to run the application
CMD ["npm", "run", "start:dev"]
