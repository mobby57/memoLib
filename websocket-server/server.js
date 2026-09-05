/**
 * MemoLib WebSocket Server (Socket.IO) — déployé sur Railway.
 *
 * Rôle:
 *  - Accepte les connexions Socket.IO des navigateurs (path /api/socket).
 *  - Authentifie chaque socket via un JWT Clerk passé dans handshake.auth.token.
 *  - Place chaque client dans des rooms `tenant:<id>` et `user:<id>`.
 *  - Expose POST /emit (protégé par WS_EMIT_SECRET) pour que l'app Next.js
 *    (Vercel, serverless) puisse relayer des notifications temps réel.
 *
 * Variables d'environnement:
 *  - PORT                 : port d'écoute (Railway l'injecte).
 *  - CLERK_SECRET_KEY     : clé secrète Clerk pour vérifier les JWT.
 *  - WS_EMIT_SECRET       : secret partagé App <-> serveur WS pour /emit.
 *  - ALLOWED_ORIGIN       : origine autorisée CORS (URL de l'app), ex https://memolib.space.
 */

const http = require('http');
const { Server: SocketIOServer } = require('socket.io');
const { verifyToken } = require('@clerk/backend');

const PORT = process.env.PORT || 8080;
const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const WS_EMIT_SECRET = process.env.WS_EMIT_SECRET;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

if (!CLERK_SECRET_KEY) {
  console.warn('[WS] CLERK_SECRET_KEY manquant — les connexions seront rejetées.');
}
if (!WS_EMIT_SECRET) {
  console.warn('[WS] WS_EMIT_SECRET manquant — /emit sera désactivé.');
}

// ============================================================
// Serveur HTTP: /health (public) + /emit (secret App -> WS)
// ============================================================
const server = http.createServer((req, res) => {
  // Health check
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Canal d'émission App (Vercel) -> serveur WS -> clients
  if (req.method === 'POST' && req.url === '/emit') {
    if (!WS_EMIT_SECRET) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'emit disabled' }));
      return;
    }

    const provided = req.headers['x-emit-secret'];
    if (provided !== WS_EMIT_SECRET) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }

    let body = '';
    let tooLarge = false;
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        tooLarge = true;
        req.destroy();
      }
    });
    req.on('end', () => {
      if (tooLarge) return;
      try {
        // payload attendu: { target: 'tenant'|'user'|'all', id?: string, event: string, data: any }
        const payload = JSON.parse(body);
        const { target, id, event, data } = payload;

        if (!event || typeof event !== 'string') {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'event required' }));
          return;
        }

        if (target === 'tenant' && id) {
          io.to(`tenant:${id}`).emit(event, data);
        } else if (target === 'user' && id) {
          io.to(`user:${id}`).emit(event, data);
        } else if (target === 'all') {
          io.emit(event, data);
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'invalid target' }));
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ============================================================
// Socket.IO
// ============================================================
const io = new SocketIOServer(server, {
  path: '/api/socket',
  cors: {
    origin: ALLOWED_ORIGIN,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware d'authentification: vérifie le JWT Clerk
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token || !CLERK_SECRET_KEY) {
      return next(new Error('Unauthorized'));
    }

    const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });

    // Clerk place les claims custom dans le JWT. On attend tenantId + role
    // via un JWT template (voir README de déploiement). userId = sub.
    socket.data.userId = payload.sub;
    socket.data.tenantId = payload.tenantId || payload.org_id || null;
    socket.data.role = payload.role || null;

    return next();
  } catch (err) {
    console.error('[WS] Auth échouée:', err.message);
    return next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  const { userId, tenantId } = socket.data;
  console.log(`[WS] Client connecté: ${socket.id} (user=${userId}, tenant=${tenantId})`);

  // Auto-join des rooms
  if (tenantId) socket.join(`tenant:${tenantId}`);
  if (userId) socket.join(`user:${userId}`);

  // Join explicite (sécurisé: on ne rejoint que SA propre room)
  socket.on('join-tenant', (joinTenantId) => {
    if (tenantId && joinTenantId === tenantId) {
      socket.join(`tenant:${joinTenantId}`);
    }
  });

  socket.on('leave-tenant', (leaveTenantId) => {
    socket.leave(`tenant:${leaveTenantId}`);
  });

  socket.on('join-user', (joinUserId) => {
    if (userId && joinUserId === userId) {
      socket.join(`user:${joinUserId}`);
    }
  });

  socket.on('disconnect', (reason) => {
    console.log(`[WS] Client déconnecté: ${socket.id} (${reason})`);
  });

  socket.on('error', (error) => {
    console.error('[WS] Socket error:', error);
  });
});

server.listen(PORT, () => {
  console.log(`✅ Serveur Socket.IO MemoLib en écoute sur le port ${PORT} (path /api/socket)`);
});

// Ping keep-alive (Socket.IO gère déjà son heartbeat, mais on log l'activité)
setInterval(() => {
  const n = io.sockets.sockets.size;
  if (n > 0) console.log(`[WS] ${n} client(s) connecté(s)`);
}, 60000);
