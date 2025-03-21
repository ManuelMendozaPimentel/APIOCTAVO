const mongoose = require('mongoose');

const respuestaSchema = new mongoose.Schema({
  // 1. Referencia al comentario (MongoDB)
  comentario_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comentario',
    required: true,
  },

  // 2. Referencia al usuario (solo id_pg de PostgreSQL)
  usuario: {
    id_pg: { type: Number, required: true }, // Solo referencia al usuario en PostgreSQL
  },

  // 3. Contenido de la respuesta
  contenido: { type: String, required: true, maxlength: 500 }, // Límite de caracteres

  // 4. Fecha de creación
  fecha_creacion: { type: Date, default: Date.now },
});

// 5. Índices para consultas frecuentes
respuestaSchema.index({ comentario_id: 1, fecha_creacion: -1 }); // Ordenar por comentario y fecha
respuestaSchema.index({ 'usuario.id_pg': 1 }); // Búsqueda por usuario

module.exports = mongoose.model('Respuesta', respuestaSchema);