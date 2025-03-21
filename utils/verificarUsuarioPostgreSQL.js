// utils/verificarUsuarioPostgreSQL.js
const Usuario = require('../models/usuarios'); // Importa tu clase Usuario

const verificarUsuarioPostgreSQL = async (id) => {
  try {
    const usuario = await Usuario.obtenerPorId(id); // Usa el método obtenerPorId
    return !!usuario; // Devuelve true si el usuario existe, false si no
  } catch (error) {
    console.error('Error al verificar usuario en PostgreSQL:', error);
    return false;
  }
};

module.exports = verificarUsuarioPostgreSQL;