const mongoose = require('mongoose');
const verificarUsuarioPostgreSQL = require('../../utils/verificarUsuarioPostgreSQL');
const verificarServicioPostgreSQL = require('../../utils/verificarServicioPostgreSQL'); // Nuevo helper

const comentarioSchema = new mongoose.Schema({
  // 1. Referencia al servicio en PostgreSQL (cambiamos de ObjectId a Number)
  servicio_id: {
    type: Number,
    required: true,
  },

  // 2. Referencia al usuario (solo id de PostgreSQL)
  usuario_id: {
    type: Number,
    required: true,
  },

  // 3. Contenido del comentario
  contenido: {
    type: String,
    required: true,
    maxlength: 500
  },

  // 4. Respuestas (mantenemos en MongoDB)
  respuestas: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Respuesta',
  }],

  // 5. Likes como array de usuarios (id de PostgreSQL)
  likes: [{
    type: Number
  }],

  // 6. Estado del comentario
  estado: {
    type: String,
    enum: ['activo', 'eliminado'],
    default: 'activo',
  },

  // 7. Auditoría
  eliminado_por: Number,
  motivo_eliminacion: String,
  fecha_creacion: {
    type: Date,
    default: Date.now
  },
  fecha_eliminacion: Date,
});

// Índices actualizados
comentarioSchema.index({ servicio_id: 1, fecha_creacion: -1 });
comentarioSchema.index({ usuario_id: 1 });

comentarioSchema.pre('save', async function (next) {
  // Validar que el servicio exista en PostgreSQL
  const servicioExists = await verificarServicioPostgreSQL(this.servicio_id);
  if (!servicioExists) {
    throw new Error('El servicio referenciado no existe');
  }

  // Validar que el usuario exista en PostgreSQL
  const usuarioExists = await verificarUsuarioPostgreSQL(this.usuario_id);
  if (!usuarioExists) {
    throw new Error('El usuario referenciado no existe');
  }

  next();
});

module.exports = mongoose.model('Comentario', comentarioSchema);  