# Use Node.js 18 with full Linux (not Alpine) to support Python dependencies
FROM node:18-bullseye-slim

# Set working directory
WORKDIR /app

# Install Python 3, pip, and required system dependencies for Prophet
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create symbolic link for python command
RUN ln -s /usr/bin/python3 /usr/bin/python

# Copy package.json and package-lock.json
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy Python requirements
COPY requirements.txt ./

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create necessary directories for forecasts
RUN mkdir -p forecasts/graphs forecasts/training_results model_cache

# Debug: List directory structure
RUN echo "=== Directory structure ===" && \
    find . -type f -name "*.js" | head -20 && \
    echo "=== Models directory ===" && \
    ls -la models/ || echo "Models directory not found!" && \
    echo "=== Python version ===" && \
    python --version && \
    echo "=== Installed Python packages ===" && \
    pip3 list | grep -E "(prophet|pandas|numpy|mysql)"

# Expose the port the app runs on
EXPOSE 7904

# Start the application
CMD ["npm", "start"]
