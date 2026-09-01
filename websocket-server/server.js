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

wss.on('connection', (ws, req) => {
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

setInterval(() => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.ping();
  });
}, 30000);
