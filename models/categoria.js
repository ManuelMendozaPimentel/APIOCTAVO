const pool = require('../config/db'); // Importa la conexión a PostgreSQL

class Categoria {
  static async crear({ nombre, descripcion }) {
    const query = `
      INSERT INTO categorias (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [nombre, descripcion];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerTodas() {
    const query = 'SELECT * FROM categorias WHERE activo = TRUE';
    const result = await pool.query(query);
    return result.rows;
  }

  static async obtenerPorId(id) {
    const query = 'SELECT * FROM categorias WHERE id = $1 AND activo = TRUE';
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async actualizar(id, { nombre, descripcion }) {
    const campos = [];
    const valores = [];
    let indice = 1;

    if (nombre !== undefined) {
      campos.push(`nombre = $${indice}`);
      valores.push(nombre);
      indice++;
    }
    if (descripcion !== undefined) {
      campos.push(`descripcion = $${indice}`);
      valores.push(descripcion);
      indice++;
    }

    if (campos.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    const query = `
      UPDATE categorias
      SET ${campos.join(', ')}
      WHERE id = $${indice} AND activo = TRUE
      RETURNING *
    `;
    valores.push(id);

    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  static async eliminar(id) {
    const query = `
      UPDATE categorias
      SET activo = FALSE
      WHERE id = $1 AND activo = TRUE
      RETURNING *
    `;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerPorNombre(nombre) {
    const query = 'SELECT * FROM categorias WHERE nombre = $1 AND activo = TRUE';
    const values = [nombre];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerInactivas() {
    const query = 'SELECT * FROM categorias WHERE activo = FALSE';
    const result = await pool.query(query);
    return result.rows;
  }

  static async activarCategoria(id, activo) {
    const query = `
      UPDATE categorias
      SET activo = $1
      WHERE id = $2
      RETURNING *
    `;
    const values = [activo, id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Categoria;