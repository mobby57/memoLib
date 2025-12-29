
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'your-refresh-secret';

export const auth = {
  generateTokens: (user) => {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  },
  
  verifyToken: (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Token required' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },
  
  hashPassword: async (password) => {
    return await bcrypt.hash(password, 12);
  },
  
  comparePassword: async (password, hash) => {
    return await bcrypt.compare(password, hash);
  }
};
