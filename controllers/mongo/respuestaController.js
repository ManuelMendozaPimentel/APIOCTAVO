const Respuesta = require('../../models/mongo/respuesta');
const Comentario = require('../../models/mongo/comentario');

// Crear una respuesta
exports.crearRespuesta = async (req, res) => {
    try {
      const { comentario_id, contenido } = req.body;
      const usuarioId = req.user.id; // Obtén el id del usuario desde el token
  
      // Obtener el comentario al que se está respondiendo
      const comentario = await Comentario.findById(comentario_id);
      if (!comentario) {
        return res.status(404).json({ error: 'Comentario no encontrado' });
      }
  
      // Validar que el usuario no esté respondiendo a su propio comentario
      if (comentario.usuario.id_pg === usuarioId) {
        return res.status(400).json({ error: 'No puedes responderte a ti mismo' });
      }
  
      // Crear la respuesta
      const respuesta = new Respuesta({
        comentario_id,
        usuario: { id_pg: usuarioId },
        contenido,
      });
  
      await respuesta.save();
  
      // Agregar la respuesta al comentario
      comentario.respuestas.push(respuesta._id);
      await comentario.save();
  
      res.status(201).json(respuesta);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  };

// Obtener respuestas de un comentario
exports.obtenerRespuestasPorComentario = async (req, res) => {
  try {
    const respuestas = await Respuesta.find({ comentario_id: req.params.comentarioId })
      .sort({ fecha_creacion: -1 });
    res.status(200).json(respuestas);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};