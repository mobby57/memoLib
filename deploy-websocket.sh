#!/bin/bash
set -e

echo "🚀 Déploiement du serveur WebSocket dédié"

WS_DIR="websocket-server"

# Si le dossier existe déjà, on le garde mais on le nettoie
if [ -d "$WS_DIR" ]; then
  echo "⚠️  Le dossier $WS_DIR existe déjà. Nettoyage des fichiers, mais on conserve..."
  rm -rf "$WS_DIR"/*
else
  mkdir -p "$WS_DIR"
fi

cd "$WS_DIR"

# 1. Créer package.json
cat > package.json << 'PKGJSON'
{
  "name": "memolib-websocket",
  "version": "1.0.0",
  "description": "Serveur WebSocket dédié pour MemoLib",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "ws": "^8.18.0"
  },
  "engines": {
    "node": "20.x"
  }
}
PKGJSON

# 2. Créer server.js
cat > server.js << 'SERVERJS'
const { WebSocketServer } = require('ws');
const http = require('http');

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('🔌 Nouvelle connexion WebSocket');
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connecté au serveur WebSocket MemoLib' }));

  ws.on('message', (message) => {
    console.log('📩 Message reçu:', message.toString());
    ws.send(JSON.stringify({ type: 'echo', data: message.toString() }));
  });

  ws.on('close', () => console.log('🔌 Connexion fermée'));
  ws.on('error', (error) => console.error('❌ Erreur WebSocket:', error));
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Serveur WebSocket en écoute sur le port ${PORT}`);
});

// Ping toutes les 30s
setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.ping();
  });
}, 30000);
SERVERJS

# 3. Créer Dockerfile
cat > Dockerfile << 'DOCKERFILE'
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY server.js .
EXPOSE 8080
CMD ["npm", "start"]
DOCKERFILE

# 4. Créer railway.json
cat > railway.json << 'RAILWAY'
{
  "build": {
    "builder": "docker"
  }
}
RAILWAY

# 5. Revenir au dossier parent
cd ..

# 6. Déployer le service
echo "📦 Déploiement du service WebSocket sur Railway..."
echo "   (si le projet existe déjà, il sera lié automatiquement)"

# On se connecte d'abord (si pas déjà fait)
npx @railway/cli login

# On se rend dans le dossier du service
cd "$WS_DIR"

# On initialise le projet (si c'est la première fois) ou on le lie
npx @railway/cli init --name memolib-websocket 2>/dev/null || echo "   Projet existant, liaison..."

# Déploiement
npx @railway/cli up

# Récupérer l'URL
echo "🔗 Récupération de l'URL du service..."
WS_URL=$(npx @railway/cli domain 2>/dev/null | grep -o 'https://[^ ]*' | head -1)

if [ -z "$WS_URL" ]; then
  WS_URL="https://memolib-websocket.up.railway.app"
  echo "⚠️  URL non récupérée automatiquement. Utilisez l'URL du tableau de bord."
fi

echo ""
echo "✅ Serveur WebSocket déployé !"
echo "🌐 URL: $WS_URL"
echo "🔑 Variable à définir : NEXT_PUBLIC_WS_URL=$WS_URL"
echo ""
echo "📌 Ajoutez-la dans votre .env.local :"
echo "   echo 'NEXT_PUBLIC_WS_URL=$WS_URL' >> ../.env.local"
echo ""
echo "   Puis redéployez votre application principale :"
echo "   cd .. && npx @railway/cli up"
