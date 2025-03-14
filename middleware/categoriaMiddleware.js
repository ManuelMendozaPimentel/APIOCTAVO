// Middleware para verificar token y roles específicos para categorías
exports.verificarCategoria = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
    }
  
    const token = authHeader.split(' ')[1];
    try {
      // Verificar el token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const usuario = await Usuario.obtenerPorId(decoded.id);
  
      if (!usuario) {
        return res.status(401).json({ message: 'Usuario no encontrado' });
      }
  
      req.user = usuario; // Adjuntar el usuario a la solicitud
  
      // Validar roles según la ruta y el método HTTP
      const ruta = req.route.path;
  
      // Crear categoría (POST /)
      if (ruta === '/' && req.method === 'POST') {
        if (usuario.rol !== 'admin') {
          return res.status(403).json({ message: 'Acceso denegado: Solo administradores pueden crear categorías' });
        }
      }
  
      // Actualizar categoría (PUT /:id)
      if (ruta === '/:id' && req.method === 'PUT') {
        if (usuario.rol !== 'admin') {
          return res.status(403).json({ message: 'Acceso denegado: Solo administradores pueden actualizar categorías' });
        }
      }
  
      // Eliminar categoría (DELETE /:id)
      if (ruta === '/:id' && req.method === 'DELETE') {
        if (usuario.rol !== 'admin') {
          return res.status(403).json({ message: 'Acceso denegado: Solo administradores pueden eliminar categorías' });
        }
      }
  
      // Obtener todas las categorías o una categoría por ID (GET / o GET /:id)
      // No se requiere rol específico, cualquier usuario autenticado puede acceder
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token inválido o expirado' });
    }
  };    