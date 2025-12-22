// 🔐 ROUTES AUTHENTIFICATION - Gestion utilisateurs
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Validation des entrées
const validateRegister = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe minimum 6 caractères'),
  body('name').notEmpty().withMessage('Nom requis')
];

const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis')
];

// 📝 Inscription
router.post('/register', validateRegister, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password, name } = req.body;

    // Vérifier si l'utilisateur existe
    const users = await getUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
      return res.status(400).json({
        error: 'Utilisateur déjà existant'
      });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur
    const user = {
      id: `user_${Date.now()}`,
      email,
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      accessibilityProfile: {
        mode: 'standard',
        fontSize: 16,
        highContrast: false,
        screenReader: false
      }
    };

    // Sauvegarde
    await saveUser(user);

    // Token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessibilityProfile: user.accessibilityProfile
      },
      token
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      error: 'Erreur lors de l\'inscription',
      message: error.message
    });
  }
});

// 🔑 Connexion
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Données invalides',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // Recherche utilisateur
    const users = await getUsers();
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(401).json({
        error: 'Identifiants invalides'
      });
    }

    // Vérification mot de passe
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Identifiants invalides'
      });
    }

    // Token JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'dev-secret',
      { expiresIn: '7d' }
    );

    // Mise à jour dernière connexion
    user.lastLogin = new Date().toISOString();
    await updateUser(user);

    res.json({
      success: true,
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessibilityProfile: user.accessibilityProfile,
        lastLogin: user.lastLogin
      },
      token
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      error: 'Erreur lors de la connexion',
      message: error.message
    });
  }
});

// 👤 Profil utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(u => u.id === req.user.userId);

    if (!user) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accessibilityProfile: user.accessibilityProfile,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur récupération profil',
      message: error.message
    });
  }
});

// ✏️ Mise à jour profil
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, accessibilityProfile } = req.body;
    
    const users = await getUsers();
    const userIndex = users.findIndex(u => u.id === req.user.userId);

    if (userIndex === -1) {
      return res.status(404).json({
        error: 'Utilisateur non trouvé'
      });
    }

    // Mise à jour
    if (name) users[userIndex].name = name;
    if (accessibilityProfile) {
      users[userIndex].accessibilityProfile = {
        ...users[userIndex].accessibilityProfile,
        ...accessibilityProfile
      };
    }
    users[userIndex].updatedAt = new Date().toISOString();

    await saveUsers(users);

    res.json({
      success: true,
      message: 'Profil mis à jour',
      user: {
        id: users[userIndex].id,
        email: users[userIndex].email,
        name: users[userIndex].name,
        accessibilityProfile: users[userIndex].accessibilityProfile
      }
    });

  } catch (error) {
    res.status(500).json({
      error: 'Erreur mise à jour profil',
      message: error.message
    });
  }
});

// 🚪 Déconnexion
router.post('/logout', (req, res) => {
  // Avec JWT, la déconnexion est côté client
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// 🔍 Vérification token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      userId: req.user.userId,
      email: req.user.email
    }
  });
});

// Middleware d'authentification
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token d\'accès requis'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'dev-secret', (err, user) => {
    if (err) {
      return res.status(403).json({
        error: 'Token invalide'
      });
    }
    req.user = user;
    next();
  });
}

// Utilitaires de gestion des utilisateurs
async function getUsers() {
  try {
    const usersPath = path.join(__dirname, '../../data/users.json');
    const data = await fs.readFile(usersPath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function saveUsers(users) {
  try {
    const usersPath = path.join(__dirname, '../../data/users.json');
    await fs.writeFile(usersPath, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Erreur sauvegarde utilisateurs:', error);
    throw error;
  }
}

async function saveUser(user) {
  const users = await getUsers();
  users.push(user);
  await saveUsers(users);
}

async function updateUser(updatedUser) {
  const users = await getUsers();
  const index = users.findIndex(u => u.id === updatedUser.id);
  if (index !== -1) {
    users[index] = updatedUser;
    await saveUsers(users);
  }
}

export { authenticateToken };
export default router;