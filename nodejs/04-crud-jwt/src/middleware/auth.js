// Middleware de autenticación: verifica el Bearer token del header Authorization.
// Si el token es válido, adjunta el payload decodificado en req.user.

import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.slice(7);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    // TokenExpiredError y JsonWebTokenError son subclases de Error propias del módulo
    const message =
      err.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    return res.status(401).json({ error: message });
  }
}
