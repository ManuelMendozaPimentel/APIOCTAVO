const Comentario = require('../../models/mongo/comentario');

// Crear un comentario
exports.crearComentario = async (req, res) => {
  try {
    const { servicio_id, contenido } = req.body;
    const usuarioId = req.user.id; // ID de PostgreSQL del usuario

    const comentario = new Comentario({
      servicio_id,
      usuario_id: usuarioId,
      contenido,
    });

    await comentario.save();
    
    res.status(201).json({
      success: true,
      message: 'Comentario creado exitosamente',
      data: comentario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear comentario',
      error: error.message
    });
  }
};

// Obtener comentarios de un servicio
exports.obtenerComentariosPorServicio = async (req, res) => {
  try {
    const comentarios = await Comentario.find({ 
      servicio_id: parseInt(req.params.servicioId), 
      estado: 'activo' 
    })
    .sort({ fecha_creacion: -1 })
    .populate('respuestas');

    res.json({
      success: true,
      data: comentarios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener comentarios',
      error: error.message
    });
  }
};

// Dar like a un comentario
exports.darLike = async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    const usuarioId = req.user.id;

    if (comentario.usuario_id === usuarioId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes darte like a ti mismo'
      });
    }

    if (!comentario.likes.includes(usuarioId)) {
      comentario.likes.push(usuarioId);
      await comentario.save();
    }

    res.json({
      success: true,
      message: 'Like agregado correctamente',
      data: comentario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al dar like',
      error: error.message
    });
  }
};

// Reportar un comentario
exports.reportarComentario = async (req, res) => {
  try {
    const comentario = await Comentario.findById(req.params.id);
    if (!comentario) {
      return res.status(404).json({
        success: false,
        message: 'Comentario no encontrado'
      });
    }

    const usuarioId = req.user.id;
    const usuarioRol = req.user.rol;

    if (usuarioRol === 'admin') {
      comentario.estado = 'eliminado';
      comentario.eliminado_por = usuarioId;
      comentario.motivo_eliminacion = 'Reportado por administrador';
      comentario.fecha_eliminacion = new Date();
      await comentario.save();
      
      return res.json({
        success: true,
        message: 'Comentario eliminado por administrador'
      });
    }

    if (!comentario.reportes) comentario.reportes = [];

    if (comentario.reportes.includes(usuarioId)) {
      return res.status(400).json({
        success: false,
        message: 'Ya has reportado este comentario'
      });
    }

    comentario.reportes.push(usuarioId);

    if (comentario.reportes.length >= 5) {
      comentario.estado = 'eliminado';
      comentario.eliminado_por = usuarioId;
      comentario.motivo_eliminacion = 'Reportado por usuarios';
      comentario.fecha_eliminacion = new Date();
      await comentario.save();
      
      return res.json({
        success: true,
        message: 'Comentario eliminado por múltiples reportes'
      });
    }

    await comentario.save();
    
    res.json({
      success: true,
      message: 'Reporte registrado correctamente',
      data: comentario
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al reportar comentario',
      error: error.message
    });
  }
};