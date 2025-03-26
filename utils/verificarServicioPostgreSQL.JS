const pool = require('../config/db'); 

async function verificarServicioPostgreSQL(servicioId) {
  try {
    const result = await pool.query(
      'SELECT id FROM servicios WHERE id = $1 AND activo = true',
      [servicioId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error al verificar servicio:', error);
    return false;
  }
}

module.exports = verificarServicioPostgreSQL;