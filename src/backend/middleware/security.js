// 🔒 INTÉGRATION CSP SÉCURISÉE - Backend Express
import helmet from 'helmet';
import { CSP_CONFIG, SECURITY_HEADERS, generateCSP } from '../csp-config.js';

// Configuration CSP pour Express avec MCP support
export function setupSecurityMiddleware(app) {
  const env = process.env.NODE_ENV || 'development';
  
  // CSP avec support MCP
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        ...CSP_CONFIG[env],
        // Ajouts spécifiques pour MCP
        'connect-src': [
          ...CSP_CONFIG[env]['connect-src'],
          'http://127.0.0.1:*', // MCP local servers
          'ws://127.0.0.1:*',   // MCP WebSocket
          'wss://127.0.0.1:*'   // MCP WebSocket Secure
        ]
      },
      reportOnly: env === 'development'
    },
    crossOriginEmbedderPolicy: false, // Nécessaire pour MCP
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  
  // Headers de sécurité additionnels
  app.use((req, res, next) => {
    // Headers standards
    Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
      res.setHeader(header, value);
    });
    
    // Headers spécifiques MCP
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    
    next();
  });
  
  console.log(`🔒 CSP configurée pour ${env}`);
}