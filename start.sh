#!/bin/bash
# Start script pour production

export FLASK_ENV=production
export PORT=${PORT:-5000}

echo "🚀 Starting IAPosteManager on port $PORT..."
python src/backend/app.py