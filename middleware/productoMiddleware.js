const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuarios');

// Middleware para verificar token y roles específicos para productos
exports.verificarProducto = async (req, res, next) => {
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

    // Validar roles según la ruta
    const ruta = req.route.path;
    if (
      (ruta === '/' && req.method === 'POST') || // Crear producto
      (ruta === '/:id' && ['PUT', 'DELETE'].includes(req.method)) || // Actualizar o eliminar producto
      ruta.includes('/stock') // Rutas de stock
    ) {
      // Solo admin puede realizar estas acciones
      if (usuario.rol !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado: Solo administradores pueden realizar esta acción' });
      }
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};