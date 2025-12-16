import jwt from 'jsonwebtoken';
import db from '../db/pg_client.js'; 

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'digisewa-secret-key-2024');
    
    // Fetch user from database
   // const result = await db.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
   // ✅ NEW (handles 'userId', 'id', 'user_id', or 'sub')
const userId = decoded.userId || decoded.id || decoded.user_id || decoded.sub;
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]); 


    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid token. User not found.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
};