// models/categoria.js

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
    const query = 'SELECT * FROM categorias';
    const result = await pool.query(query);
    return result.rows;
  }

  static async obtenerPorId(id) {
    const query = 'SELECT * FROM categorias WHERE id = $1';
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
      WHERE id = $${indice}
      RETURNING *
    `;
    valores.push(id);

    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  static async eliminar(id) {
    const query = 'DELETE FROM categorias WHERE id = $1 RETURNING *';
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerPorNombre(nombre) {
    const query = 'SELECT * FROM categorias WHERE nombre = $1';
    const values = [nombre];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Categoria;
