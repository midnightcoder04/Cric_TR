FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY ml_requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r ml_requirements.txt

# Copy application
COPY ml_api_server.py .

# Create models directory
RUN mkdir -p /models

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/health')"

# Run application
CMD ["python", "ml_api_server.py"]
