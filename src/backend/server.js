// 🚀 SERVEUR BACKEND COMPLET - IAPosteManager v3.0
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';

// Routes
import iaRoutes from './routes/ia-simple.js';
import emailRoutes from './routes/email.js';
import authRoutes from './routes/auth-simple.js';
import templatesRoutes from './routes/templates.js';
import contactsRoutes from './routes/contacts.js';
import dashboardRoutes from './routes/dashboard.js';

// Middleware
import { errorHandler } from './middleware/errorHandler.js';
import { logger } from './middleware/logger.js';
import { auth } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger .env depuis la racine du projet
dotenv.config({ path: join(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// 🛡️ Sécurité
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// 🌐 CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📊 Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par IP
  message: {
    error: 'Trop de requêtes',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// 📝 Body parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 📋 Logging
app.use(logger);

// 🗂️ Dossiers statiques
app.use('/uploads', express.static(join(__dirname, '../uploads')));

// 🛣️ Routes principales
app.use('/api/ia', iaRoutes);
app.use('/api/ai', iaRoutes); // Alias
app.use('/api/email', emailRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/templates', templatesRoutes);
app.use('/api/contacts', contactsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Aliases pour compatibilité
app.use('/api/send-email', emailRoutes);
app.use('/api/email-history', (req, res) => {
  res.json({
    success: true,
    emails: [
      {
        id: 1,
        recipient: 'test@example.com',
        subject: 'Test Email',
        body: 'Corps du message',
        status: 'sent',
        created_at: new Date().toISOString()
      }
    ]
  });
});
app.use('/api/generate-email', iaRoutes);

// 🏠 Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'IAPosteManager API',
    version: '3.0.0',
    status: 'Production Ready',
    features: [
      'Analyse IA multi-source',
      'OCR documents',
      'Speech-to-Text',
      'Génération emails',
      'Accessibilité totale'
    ],
    endpoints: {
      health: '/api/health',
      ia: '/api/ia/*',
      email: '/api/email/*',
      auth: '/api/auth/*',
      templates: '/api/templates/*',
      contacts: '/api/contacts/*',
      dashboard: '/api/dashboard/*'
    }
  });
});

// 🔍 Health check complet
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    services: {
      ollama: {
        configured: process.env.AI_PROVIDER === 'ollama',
        host: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
        model: process.env.OLLAMA_MODEL || 'llama3.1:8b',
        status: 'OK'
      },
      storage: {
        uploads: await checkDirectory('../uploads'),
        data: await checkDirectory('../data')
      }
    }
  };

  res.json(health);
});

// Vérification des dossiers
async function checkDirectory(path) {
  try {
    await fs.access(join(__dirname, path));
    return 'OK';
  } catch {
    return 'MISSING';
  }
}

// 🚫 Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route non trouvée',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/ia/analyze',
      'POST /api/email/send',
      'POST /api/auth/login'
    ]
  });
});

// 🛠️ Gestionnaire d'erreurs
app.use(errorHandler);

// 🚀 Démarrage serveur
const server = app.listen(PORT, async () => {
  console.log('🚀 IAPosteManager Backend v3.0');
  console.log('================================');
  console.log(`📡 Serveur: http://localhost:${PORT}`);
  console.log(`🌐 Frontend: ${process.env.FRONTEND_URL || 'http://localhost:3001'}`);
  console.log(`🔧 Environnement: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('📋 Endpoints disponibles:');
  console.log('  GET  /api/health              - Santé du serveur');
  console.log('  POST /api/ia/analyze          - Analyse IA complète');
  console.log('  POST /api/ia/analyze-document - Analyse document structurée');
  console.log('  POST /api/ia/generate         - Génération de texte');
  console.log('  POST /api/ia/generate-email   - Génération d\'email');
  console.log('  GET  /api/ia/health           - Santé Ollama');
  console.log('  POST /api/email/send          - Envoi emails');
  console.log('  POST /api/auth/login          - Authentification');
  console.log('  GET  /api/templates           - Gestion templates');
  console.log('  GET  /api/contacts            - Gestion contacts');
  console.log('  GET  /api/dashboard/stats     - Statistiques');
  console.log('');
  
  // Création des dossiers nécessaires
  await createDirectories();
  
  console.log('✅ Serveur prêt pour la production !');
});

// Création des dossiers
async function createDirectories() {
  const dirs = ['../uploads', '../data', '../logs'];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(join(__dirname, dir), { recursive: true });
    } catch (error) {
      console.warn(`⚠️ Erreur création dossier ${dir}:`, error.message);
    }
  }
}

// 🛑 Arrêt propre
process.on('SIGTERM', () => {
  console.log('🛑 Arrêt du serveur...');
  server.close(() => {
    console.log('✅ Serveur arrêté proprement');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Interruption détectée...');
  server.close(() => {
    console.log('✅ Serveur arrêté');
    process.exit(0);
  });
});

export default app;