/**
 * 🔥 CRITICAL: Import Sentry FIRST, before all other imports
 * This ensures all errors are captured from the start
 */
require('./instrument.js');

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const redis = require('redis');
const axios = require('axios');
const path = require('path');

// Get the Sentry instance from instrument.js
const Sentry = require('./instrument.js');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

// Sentry request handler middleware - MUST be first
app.use(Sentry.requestHandler());

// Configuration
const PORT = process.env.PORT || 3000;
const PYTHON_API = process.env.PYTHON_API || 'http://localhost:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Redis client
const redisClient = redis.createClient();
redisClient.connect();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Authentication
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Forward to Python backend
    const response = await axios.post(`${PYTHON_API}/api/auth/login`, {
      username,
      password,
    });

    if (response.data.success) {
      const token = jwt.sign({ username: response.data.user.username }, JWT_SECRET, {
        expiresIn: '24h',
      });

      res.json({ success: true, token, user: response.data.user });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Legal AI Endpoints
app.post('/api/legal/predict', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/api/ceseda/predict`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.post('/api/legal/analyze', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/api/ceseda/analyze`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Analysis failed' });
  }
});

// Deadlines Management
app.get('/api/legal/deadlines', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/legal/delais/a-venir`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch deadlines' });
  }
});

app.post('/api/legal/deadlines', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/api/legal/delais/calculer`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to calculate deadline' });
  }
});

// Billing Management
app.post('/api/legal/invoice', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/api/legal/facturation/facture`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Invoice generation failed' });
  }
});

app.get('/api/legal/billing-stats', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/legal/facturation/stats`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch billing stats' });
  }
});

// Compliance Management
app.post('/api/legal/compliance/dossier', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/api/legal/conformite/dossier`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create dossier' });
  }
});

app.get('/api/legal/compliance/registre', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${PYTHON_API}/api/legal/conformite/registre`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch registre' });
  }
});

// Document Generation
app.post('/api/legal/generate-document', authenticateToken, async (req, res) => {
  try {
    const response = await axios.post(`${PYTHON_API}/api/legal/templates/generate`, req.body);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Document generation failed' });
  }
});

// Real-time features with Socket.IO
io.on('connection', socket => {
  console.log('Client connected:', socket.id);

  // Join user room
  socket.on('join-user', userId => {
    socket.join(`user-${userId}`);
  });

  // Handle voice analysis
  socket.on('voice-analysis', async data => {
    try {
      const response = await axios.post(`${PYTHON_API}/api/ceseda/analyze`, {
        text: data.transcript,
        language: data.language,
      });

      socket.emit('voice-result', response.data);
    } catch (error) {
      socket.emit('voice-error', { error: 'Analysis failed' });
    }
  });

  // Handle deadline alerts
  socket.on('check-deadlines', async userId => {
    try {
      const response = await axios.get(`${PYTHON_API}/api/legal/delais/urgents`);
      if (response.data.urgent_deadlines?.length > 0) {
        socket.emit('deadline-alert', response.data.urgent_deadlines);
      }
    } catch (error) {
      console.error('Deadline check failed:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'frontend-node',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
});

// 🔥 Sentry debugging route (remove in production!)
// This endpoint tests if Sentry is properly configured
// It intentionally throws an error to verify that Sentry captures it
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/monitoring/sentry-test', (req, res) => {
    try {
      // Intentional error: calling undefined function foo()
      // This will generate a real ReferenceError
      foo();
    } catch (e) {
      // Capture the actual error with Sentry
      Sentry.captureException(e);
      res.status(200).json({
        success: true,
        message: 'Test error sent to Sentry',
        error: e.message,
        note: 'Check your Sentry dashboard for this error within 24hrs',
      });
    }
  });
}

// 🔥 Sentry error handler MUST be before other error handlers
app.use(Sentry.errorHandler());

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
server.listen(PORT, () => {
  console.log(`🟢 Node.js Frontend running on port ${PORT}`);
  console.log(`🔗 Connected to Python API: ${PYTHON_API}`);
});

module.exports = app;
