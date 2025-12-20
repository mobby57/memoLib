FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend-react/package*.json ./
RUN npm ci
COPY frontend-react/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app

# Dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    espeak \
    libespeak1 \
    libespeak-dev \
    && rm -rf /var/lib/apt/lists/*

# Créer utilisateur non-root
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Dépendances Python (en tant que root, avant de changer d'utilisateur)
COPY requirements.txt .
RUN pip install --no-cache-dir --no-warn-script-location -r requirements.txt

# Code application
COPY src/ ./src/
COPY --from=frontend-build /app/frontend/dist ./src/frontend/dist

# Models directory (needed for workflow tests)
COPY models/ ./models/

# Tests directory (needed for pytest in Docker)
COPY tests/ ./tests/
COPY pytest.ini ./

# Permissions pour l'utilisateur non-root
RUN chown -R appuser:appuser /app

# Créer répertoire data avec permissions
RUN mkdir -p /app/data && chown -R appuser:appuser /app/data

# Basculer vers utilisateur non-root
USER appuser

# Données persistantes
VOLUME ["/app/data"]

EXPOSE 5000
CMD ["python", "src/backend/app.py"]