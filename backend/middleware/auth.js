/**
 * JWT token verification (for route protection) */

const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'Missing token. Authorization denied.' });
  }
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production'
    );
    req.user = decoded.user;
    next();
  } catch (err) { res.status(401).json({ msg: 'Invalid token.' }); }
};
