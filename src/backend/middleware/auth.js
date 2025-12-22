// 🔐 MIDDLEWARE AUTHENTIFICATION - IAPosteManager v3.0
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'iapostemanager-secret-key-2024';

export const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Token d\'authentification requis',
        code: 'NO_TOKEN'
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Token invalide',
      code: 'INVALID_TOKEN'
    });
  }
};

export const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};