// authMiddleware.js
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');

// Middleware para verificar el token
exports.verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.obtenerPorId(decoded.id);
    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }
    req.user = usuario; // Adjuntar el usuario a la solicitud
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// Middleware para verificar roles
exports.verificarRol = (rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.user.rol)) {
    return res.status(403).json({ message: 'Acceso denegado' });
  }
  next();
};