const mongoose = require('mongoose');

const servicioSchema = new mongoose.Schema({
  // 1. Agregar un slug para URLs amigables
  slug: { type: String, unique: true, lowercase: true }, // Ej: "servicio-de-diseno"
  nombre: { type: String, required: true },
  descripcion: String,
  icono: String,
  activo: { type: Boolean, default: true }, // Para eliminación lógica
  fecha_creacion: { type: Date, default: Date.now },

  // 2. Referencia al usuario creador (id_pg de PostgreSQL)
  creado_por: { type: Number, required: true }, // id_pg del usuario en PostgreSQL

  // 3. Campos adicionales para SEO
  meta_titulo: String,
  meta_descripcion: String,
});

// 4. Índices para búsquedas frecuentes
servicioSchema.index({ slug: 1 }); // Búsqueda rápida por slug
servicioSchema.index({ nombre: 1 }); // Búsqueda rápida por nombre

module.exports = mongoose.model('Servicio', servicioSchema);