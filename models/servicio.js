const pool = require('../config/db');

class Servicio {
  static async crear(servicio) {
    const { nombre, descripcion, precio, duracion_minutos, creado_por } = servicio;
    const query = `
      INSERT INTO servicios 
        (nombre, descripcion, precio, duracion_minutos, creado_por)
      VALUES 
        ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [nombre, descripcion, precio, duracion_minutos, creado_por];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerTodos(activo = true) {
    const query = `
      SELECT s.*, u.nombre as creador_nombre 
      FROM servicios s
      LEFT JOIN usuarios u ON s.creado_por = u.id
      WHERE s.activo = $1
      ORDER BY s.nombre
    `;
    const result = await pool.query(query, [activo]);
    return result.rows;
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT s.*, u.nombre as creador_nombre 
      FROM servicios s
      LEFT JOIN usuarios u ON s.creado_por = u.id
      WHERE s.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async actualizar(id, datos) {
    const campos = [];
    const valores = [];
    let indice = 1;

    for (const [campo, valor] of Object.entries(datos)) {
      campos.push(`${campo} = $${indice}`);
      valores.push(valor);
      indice++;
    }

    const query = `
      UPDATE servicios
      SET ${campos.join(', ')}
      WHERE id = $${indice}
      RETURNING *
    `;
    valores.push(id);
    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  static async eliminar(id) {
    // Eliminación lógica
    const query = `
      UPDATE servicios
      SET activo = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async buscarPorNombre(nombre) {
    const query = `
      SELECT * FROM servicios 
      WHERE nombre ILIKE $1 AND activo = true
      ORDER BY nombre
    `;
    const result = await pool.query(query, [`%${nombre}%`]);
    return result.rows;
  }
}

module.exports = Servicio;  