#!/bin/bash
set -e
echo "========== INSTALLATION IAPOSTEMANAGER =========="
echo "[1/6] Virtualenv..."
python3.10 -m venv ~/.virtualenvs/iapostemanage || true
source ~/.virtualenvs/iapostemanage/bin/activate
echo "[2/6] Installation pip..."
pip install --upgrade pip
pip install -r requirements.txt
echo "[3/6] Configuration .env..."
cat > .env << 'ENVEOF'
SECRET_KEY=fa7cd9f2eefab93cf5637d425750a3482df2136b229cd1e5467a5ebb05f2aef9
JWT_SECRET_KEY=64a875f2d31cdab1621d4864aceaa272778a09c74dd78ab4edecc84af2f3c362
FLASK_ENV=production
DATABASE_URL=sqlite:///./data/iapostemanage.db
API_PREFIX=/api
PORT=8000
ENVEOF
echo "[4/6] Dossier data..."
mkdir -p data
echo "[5/6] Database..."
python -c "from src.backend.database import init_db; init_db()"
echo "[6/6] Test..."
python -c "from src.backend.main_fastapi import app; print('✅ OK')"
echo "========== INSTALLATION TERMINÉE =========="
