const Comentario = require('../../models/mongo/comentario');

// Crear un comentario
exports.crearComentario = async (req, res) => {
    try {
      const { servicio, contenido } = req.body;
      const usuarioId = req.user.id; // Obtén el id del usuario desde el token
  
      const comentario = new Comentario({
        servicio,
        usuario: { id_pg: usuarioId }, // Usa el id del usuario autenticado
        contenido,
      });
  
      await comentario.save();
      res.status(201).json(comentario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

// Obtener comentarios de un servicio
exports.obtenerComentariosPorServicio = async (req, res) => {
  try {
    const comentarios = await Comentario.find({ servicio: req.params.servicioId, estado: 'activo' })
      .sort({ fecha_creacion: -1 })
      .populate('respuestas');
    res.status(200).json(comentarios);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Dar like a un comentario
exports.darLike = async (req, res) => {
    try {
      const comentario = await Comentario.findById(req.params.id);
      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }
  
      const usuarioId = req.user.id; // Obtén el id del usuario desde el token
  
      // Validar que el usuario no esté dando like a su propio comentario
      if (comentario.usuario.id_pg === usuarioId) {
        return res.status(400).json({ error: 'No puedes darte like a ti mismo' });
      }
  
      // Agregar el like si no lo ha dado antes
      if (!comentario.likes.includes(usuarioId)) {
        comentario.likes.push(usuarioId);
        await comentario.save();
      }
  
      res.status(200).json(comentario);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

// Reportar un comentario
exports.reportarComentario = async (req, res) => {
    try {
      const comentario = await Comentario.findById(req.params.id);
      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }
  
      const usuarioId = req.user.id; // Obtén el id del usuario desde el token
      const usuarioRol = req.user.rol; // Obtén el rol del usuario desde el token
  
      // Si el usuario es admin, eliminar el comentario directamente
      if (usuarioRol === 'admin') {
        comentario.estado = 'eliminado';
        comentario.eliminado_por = usuarioId;
        comentario.motivo_eliminacion = 'Reportado por administrador';
        await comentario.save();
        return res.status(200).json({ mensaje: 'Comentario eliminado por administrador' });
      }
  
      // Si no es admin, incrementar reportes
      if (!comentario.reportes) comentario.reportes = [];
  
      // Validar que el usuario no haya reportado antes
      if (comentario.reportes.includes(usuarioId)) {
        return res.status(400).json({ error: 'Ya has reportado este comentario' });
      }
  
      // Agregar el reporte
      comentario.reportes.push(usuarioId);
  
      // Si hay más de 5 reportes, eliminar el comentario
      if (comentario.reportes.length >= 5) {
        comentario.estado = 'eliminado';
        comentario.eliminado_por = usuarioId;
        comentario.motivo_eliminacion = 'Reportado por usuarios';
        await comentario.save();
        return res.status(200).json({ mensaje: 'Comentario eliminado por múltiples reportes' });
      }
  
      await comentario.save();
      res.status(200).json({ mensaje: 'Reporte registrado correctamente', comentario });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };