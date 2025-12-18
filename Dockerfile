FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY src/frontend/package*.json ./
RUN npm ci
COPY src/frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code application
COPY src/ ./src/
COPY --from=frontend-build /app/frontend/dist ./src/frontend/dist

# Models directory (needed for workflow tests)
COPY models/ ./models/

# Tests directory (needed for pytest in Docker)
COPY tests/ ./tests/
COPY pytest.ini ./

# Données persistantes
VOLUME ["/app/data"]

EXPOSE 5000
CMD ["python", "src/backend/app.py"]