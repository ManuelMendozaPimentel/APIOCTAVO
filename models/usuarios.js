const pool = require('../config/db');

class Usuario {
  static async obtenerPorCorreo(correo) {
    const query = 'SELECT * FROM usuarios WHERE correo = $1';
    const values = [correo];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerPorId(id) {
    const query = 'SELECT * FROM usuarios WHERE id = $1';
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async crear(usuario) {
    const { nombre, apellidos, correo, contrasena, google_id, direccion, telefono, rol, cambiar_contrasena } = usuario;
    const query = `
      INSERT INTO usuarios 
        (nombre, apellidos, correo, contrasena, google_id, direccion, telefono, rol, cambiar_contrasena)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, nombre, apellidos, correo, rol, direccion, telefono, google_id, cambiar_contrasena
    `;
    const values = [
      nombre,
      apellidos || '',
      correo,
      contrasena,
      google_id || null,
      direccion || '',
      telefono || '',
      rol || 'cliente',
      cambiar_contrasena || false
    ];
    const result = await pool.query(query, values);
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
      UPDATE usuarios
      SET ${campos.join(', ')}
      WHERE id = $${indice}
      RETURNING id, nombre, apellidos, correo, rol, direccion, telefono, google_id, cambiar_contrasena
    `;
    valores.push(id);
    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  static async eliminar(id) {
    const query = 'DELETE FROM usuarios WHERE id = $1 RETURNING *';
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerTodos() {
    const query = 'SELECT id, nombre, apellidos, correo, rol, direccion, telefono FROM usuarios';
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Usuario;