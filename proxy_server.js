const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 9000;

// CORS pour tous les services
app.use(cors());
app.use(express.json());

// Page d'accueil du proxy
app.get('/', (req, res) => {
  res.json({
    name: 'IA Poste Manager v3.1 - Proxy Multi-Stack',
    services: {
      flask: 'http://localhost:5000',
      nextjs: 'http://localhost:3000', 
      nodejs: 'http://localhost:8000'
    },
    routes: {
      '/flask/*': 'Proxy vers Flask Python',
      '/nextjs/*': 'Proxy vers Next.js',
      '/nodejs/*': 'Proxy vers Node.js API'
    }
  });
});

// Proxy vers Flask (Python)
app.use('/flask', createProxyMiddleware({
  target: 'http://localhost:5000',
  changeOrigin: true,
  pathRewrite: { '^/flask': '' }
}));

// Proxy vers Next.js
app.use('/nextjs', createProxyMiddleware({
  target: 'http://localhost:3000',
  changeOrigin: true,
  pathRewrite: { '^/nextjs': '' }
}));

// Proxy vers Node.js API
app.use('/nodejs', createProxyMiddleware({
  target: 'http://localhost:8000',
  changeOrigin: true,
  pathRewrite: { '^/nodejs': '' }
}));

// Route de test unifiée
app.post('/api/test-all', async (req, res) => {
  const { dossier_text } = req.body;
  
  const results = {
    flask: null,
    nextjs: null,
    nodejs: null
  };

  try {
    // Test Flask
    const flaskResponse = await fetch('http://localhost:5000/api/ceseda/hybrid-predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier_text })
    });
    results.flask = await flaskResponse.json();
  } catch (e) {
    results.flask = { error: 'Flask non disponible' };
  }

  try {
    // Test Next.js
    const nextResponse = await fetch('http://localhost:3000/api/ceseda/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier_text })
    });
    results.nextjs = await nextResponse.json();
  } catch (e) {
    results.nextjs = { error: 'Next.js non disponible' };
  }

  try {
    // Test Node.js
    const nodeResponse = await fetch('http://localhost:8000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dossier_text })
    });
    results.nodejs = await nodeResponse.json();
  } catch (e) {
    results.nodejs = { error: 'Node.js non disponible' };
  }

  res.json({
    success: true,
    results,
    message: 'Test des 3 stacks terminé'
  });
});

app.listen(PORT, () => {
  console.log(`🔄 Proxy Multi-Stack démarré sur http://localhost:${PORT}`);
  console.log('📊 Routes disponibles:');
  console.log('• /flask/*  → Flask Python (port 5000)');
  console.log('• /nextjs/* → Next.js (port 3000)');
  console.log('• /nodejs/* → Node.js API (port 8000)');
  console.log('• POST /api/test-all → Test des 3 services');
});