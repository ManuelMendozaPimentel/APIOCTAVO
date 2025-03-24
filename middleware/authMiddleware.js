const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');

exports.verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Autenticación requerida' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.obtenerPorId(decoded.id);
    
    if (!usuario) {
      return res.status(401).json({ message: 'Usuario no encontrado' });
    }

    req.user = {
      id: usuario.id,
      correo: usuario.correo,
      rol_id: usuario.rol_id,
      rol_nombre: usuario.rol_nombre
    };
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

exports.verificarRol = (rolesPermitidos) => (req, res, next) => {
  if (!rolesPermitidos.includes(req.user.rol_nombre)) {
    return res.status(403).json({ message: 'Acceso no autorizado' });
  }
  next();
};