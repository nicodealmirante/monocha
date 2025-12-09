const { verify } = require('../utils/jwt');

function verifyToken(req, res, next) {
  const header = req.headers['authorization'] || '';
  const [, token] = header.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'JWT_SECRET no configurado' });
  }

  try {
    const payload = verify(token, secret);
    req.user = payload;
    return next();
  } catch (err) {
    console.error('Error verificando token:', err);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = { verifyToken };
