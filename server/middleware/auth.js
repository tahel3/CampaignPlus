import jwt from 'jsonwebtoken';

const authenticateToken = (req, res, next) => {
  // קבלת הטוקן מה-header של הבקשה
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) {
    return res.status(401).json({ message: 'Authorization token not provided.' });
  }

  // אימות הטוקן
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(401).json({ message: 'Invalid or expired token.' });
    }

    req.user = user;
    next();
  });
};

export default authenticateToken;