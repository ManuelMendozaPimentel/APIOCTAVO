const mongoose = require('mongoose');

// Definir el esquema del modelo Usuario
const usuarioSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
    },
    apellidos: {
        type: String,
        default: null,
    },
    correo: {
        type: String,
        required: true,
        unique: true,
    },
    contrasena: {
        type: String,
    },
    google_token: {
        type: String,
        default: null,
    },
    direccion: {
        type: String,
        default: null,
    },
    telefono: {
        type: String,
        default: null,
    },
    veces_no_recogido: {
        type: Number,
        default: 0,
    },
    rol: {
        type: String,
        enum: ['administrador', 'cliente', 'empleado'],
        default: 'cliente',
    }
});

// Crear el modelo de Usuario
const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario;

