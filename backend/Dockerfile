# Use Node.js 18 Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Debug: List directory structure
RUN echo "=== Directory structure ===" && \
    find . -type f -name "*.js" | head -20 && \
    echo "=== Models directory ===" && \
    ls -la models/ || echo "Models directory not found!"

# Expose the port the app runs on
EXPOSE 7904

# Start the application
CMD ["npm", "start"]
