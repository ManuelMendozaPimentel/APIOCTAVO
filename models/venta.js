const mongoose = require('mongoose');

const ventaSchema = new mongoose.Schema({
  productos: [
    {
      producto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto',
        required: true,
      },
      cantidad: {
        type: Number,
        required: true,
      },
      precioUnitario: {
        type: Number,
        required: true,
      },
      subtotal: {
        type: Number,
        required: true,
      },
    },
  ],
  total: {
    type: Number,
    required: true,
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  empleado: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true,
  },
  estatus: {
    type: String,
    enum: ['pendiente', 'completada', 'cancelada'],
    default: 'completada',
  },
  fecha: {
    type: Date,
    default: Date.now,
  },
});

// Verifica si el modelo ya está compilado antes de crearlo
module.exports = mongoose.models.Venta || mongoose.model('Venta', ventaSchema);