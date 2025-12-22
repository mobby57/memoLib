// 🔐 ROUTES AUTHENTIFICATION - IAPosteManager v3.0
import express from 'express';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Utilisateur admin simple (pour développement)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// POST /api/auth/login - Connexion
router.post('/login', async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Mot de passe requis'
      });
    }
    
    // Vérification simple du mot de passe
    if (password === ADMIN_PASSWORD) {
      const token = generateToken({ 
        id: 1, 
        username: 'admin',
        role: 'admin'
      });
      
      res.json({
        success: true,
        token,
        user: {
          id: 1,
          username: 'admin',
          role: 'admin'
        },
        message: 'Connexion réussie'
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Mot de passe incorrect'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
      message: error.message
    });
  }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// GET /api/auth/me - Profil utilisateur
router.get('/me', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Token requis'
    });
  }
  
  try {
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET || 'iapostemanager-secret-key-2024');
    
    res.json({
      success: true,
      user: decoded
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide'
    });
  }
});

export default router;