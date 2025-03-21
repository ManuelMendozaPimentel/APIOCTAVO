const mongoose = require('mongoose');
const verificarUsuarioPostgreSQL = require('../../utils/verificarUsuarioPostgreSQL'); 

const comentarioSchema = new mongoose.Schema({
  // 1. Referencia al servicio (MongoDB)
  servicio: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servicio',
    required: true,
  },

  // 2. Referencia al usuario (solo id_pg de PostgreSQL)
  usuario: {
    id_pg: { type: Number, required: true }, // Solo referencia al usuario en PostgreSQL
  },

  // 3. Contenido del comentario
  contenido: { type: String, required: true, maxlength: 500 }, // Límite de caracteres

  // 4. Respuestas normalizadas (en lugar de embebidas)
  respuestas: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Respuesta', // Colección separada para respuestas
    },
  ],

  // 5. Likes como array de usuarios (id_pg de PostgreSQL)
  likes: [{ type: Number }], // Array de id_pg de usuarios que dieron like

  // 6. Estado del comentario (activo o eliminado)
  estado: {
    type: String,
    enum: ['activo', 'eliminado'],
    default: 'activo',
  },

  // 7. Auditoría para eliminación
  eliminado_por: Number, // id_pg del usuario que eliminó el comentario
  motivo_eliminacion: String, // Razón de la eliminación
  fecha_creacion: { type: Date, default: Date.now }, // Fecha de creación
  fecha_eliminacion: Date, // Fecha de eliminación (si aplica)
});

// 8. Índices para consultas frecuentes
comentarioSchema.index({ servicio: 1, fecha_creacion: -1 }); // Ordenar por servicio y fecha
comentarioSchema.index({ 'usuario.id_pg': 1 }); // Búsqueda por usuario

comentarioSchema.pre('save', async function (next) {
    // Validar que el servicio exista en MongoDB
    const servicioExists = await mongoose.model('Servicio').exists({ _id: this.servicio });
    if (!servicioExists) {
      throw new Error('El servicio referenciado no existe');
    }
  
    // Validar que el usuario exista en PostgreSQL
    const usuarioExists = await verificarUsuarioPostgreSQL(this.usuario.id_pg);
    if (!usuarioExists) {
      throw new Error('El usuario referenciado no existe');
    }
  
    next();
  });

module.exports = mongoose.model('Comentario', comentarioSchema);