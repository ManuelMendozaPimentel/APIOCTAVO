const pool = require('../config/db');

class Usuario {
  static async obtenerPorCorreo(correo) {
    const query = `
      SELECT u.*, r.nombre as rol_nombre 
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.correo = $1
    `;
    const values = [correo];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.correo, 
        u.telefono, u.google_id, u.cambiar_contrasena, 
        u.activo, u.rol_id, r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.id = $1
    `;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async crear(usuario) {
    // Asignar valores por defecto si no vienen en el objeto
    const { 
      nombre, 
      apellidos, 
      correo, 
      contrasena, 
      telefono, 
      rol_id = 2, // Valor por defecto para rol_id (cliente)
      cambiar_contrasena = false,
      activo = true
    } = usuario;
  
    const query = `
      INSERT INTO usuarios 
        (nombre, apellidos, correo, contrasena, telefono, rol_id, cambiar_contrasena, activo)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nombre, apellidos, correo, telefono, rol_id
    `;
  
    const values = [
      nombre,
      apellidos,
      correo,
      contrasena,
      telefono,
      rol_id,
      cambiar_contrasena,
      activo
    ];
  
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear usuario:', error);
      throw error;
    }
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
      RETURNING id, nombre, apellidos, correo, telefono, rol_id, google_id, cambiar_contrasena
    `;
    valores.push(id);
    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  static async eliminar(id) {
    const query = `
      UPDATE usuarios
      SET activo = false
      WHERE id = $1
      RETURNING id, nombre, apellidos, correo, telefono, rol_id, google_id, cambiar_contrasena, activo
    `;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerTodos() {
    const query = `
      SELECT 
        u.id, u.nombre, u.apellidos, u.correo, 
        u.telefono, r.nombre as rol_nombre
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      WHERE u.activo = true
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async obtenerDirecciones(usuario_id) {
    const query = 'SELECT * FROM direcciones WHERE usuario_id = $1 ORDER BY principal DESC';
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }
}

module.exports = Usuario;