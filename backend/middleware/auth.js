import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'grocery_app_secret_key_2024';

export function authenticateToken(req, res, next) {
  const token = 
    req.cookies?.grocery_token || 
    req.cookies?.token || 
    (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export { JWT_SECRET };
