// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const verificarRol = (rolesPermitidos) => (req, res, next) => {
  const usuario = req.user;
  if (!usuario || !rolesPermitidos.includes(usuario.rol)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};

const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

module.exports = { verificarToken, verificarRol };