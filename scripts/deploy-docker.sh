#!/bin/bash
set -e
echo "🐳 Déploiement Docker de MemoLib"

# Vérifier Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker introuvable."
    exit 1
fi

# Créer Dockerfile
if [ ! -f Dockerfile ]; then
    echo "📄 Création du Dockerfile..."
    cat > Dockerfile << 'DOCKER'
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
DOCKER
    echo "✅ Dockerfile créé"
fi

# Créer docker-compose.yml (optionnel)
if [ ! -f docker-compose.yml ]; then
    echo "📄 Création de docker-compose.yml..."
    cat > docker-compose.yml << 'COMP'
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/memolib
    depends_on:
      - db
  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=memolib
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
COMP
    echo "✅ docker-compose.yml créé"
fi

# Charger .env.local si présent
if [ -f .env.local ]; then
    echo "📂 Chargement des variables depuis .env.local"
    set -a
    source .env.local
    set +a
fi

# Choix du mode
echo ""
echo "Choisissez le mode :"
echo "1) Base de données distante (DATABASE_URL déjà définie)"
echo "2) Base de données locale (PostgreSQL via Docker Compose)"
read -p "Entrez 1 ou 2 (défaut: 1) : " MODE
MODE=${MODE:-1}

if [ "$MODE" == "2" ]; then
    echo "🐘 Lancement avec base PostgreSQL locale..."
    docker-compose up -d --build
    echo "✅ App sur http://localhost:3000"
    echo "   Logs : docker-compose logs -f"
else
    if [ -z "$DATABASE_URL" ]; then
        read -p "Entrez l'URL de votre base distante : " DATABASE_URL
    fi
    if [ -z "$NEXTAUTH_SECRET" ]; then
        NEXTAUTH_SECRET=$(openssl rand -base64 32)
        echo "🔑 Secret généré : $NEXTAUTH_SECRET"
    fi
    NEXTAUTH_URL=${NEXTAUTH_URL:-http://localhost:3000}

    echo "🏗️ Construction de l'image..."
    docker build -t memolib .

    echo "🚀 Lancement du conteneur..."
    docker run -d \
        -p 3000:3000 \
        -e DATABASE_URL="$DATABASE_URL" \
        -e NEXTAUTH_SECRET="$NEXTAUTH_SECRET" \
        -e NEXTAUTH_URL="$NEXTAUTH_URL" \
        --name memolib_app \
        memolib

    echo "✅ App sur http://localhost:3000"
    echo "   Logs : docker logs -f memolib_app"
    echo "   Arrêt : docker stop memolib_app"
fi

echo "🎉 Terminé !"
