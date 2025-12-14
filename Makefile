.PHONY: help install test format lint run docker-up docker-down backup

help:
	@echo "SecureVault - Commandes disponibles:"
	@echo "  make install    - Installer dépendances"
	@echo "  make test       - Lancer tests"
	@echo "  make format     - Formater code (black + isort)"
	@echo "  make lint       - Vérifier code"
	@echo "  make run        - Lancer application"
	@echo "  make docker-up  - Démarrer avec Docker"
	@echo "  make backup     - Backup database"

install:
	pip install -r requirements.txt
	pre-commit install

test:
	pytest tests/ -v --cov=src --cov-report=html

format:
	black src/ tests/
	isort src/ tests/

lint:
	black --check src/ tests/
	isort --check src/ tests/

run:
	python src/web/app.py

docker-up:
	docker-compose up -d

docker-down:
	docker-compose down

backup:
	python scripts/backup_db.py

init-db:
	python scripts/init_db.py
