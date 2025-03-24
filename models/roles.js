const pool = require('../config/db');

class Rol {
  static async crear(rol) {
    const { nombre, descripcion } = rol;
    const query = `
      INSERT INTO roles (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, descripcion]);
    return result.rows[0];
  }

  static async obtenerTodos() {
    const query = 'SELECT * FROM roles WHERE activo = true';
    const result = await pool.query(query);
    return result.rows;
  }

  static async obtenerPorId(id) {
    const query = 'SELECT * FROM roles WHERE id = $1 AND activo = true';
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
      UPDATE roles
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
    const query = 'UPDATE roles SET activo = false WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Rol;