const pool = require('../config/db');

class Proveedor {
  static async crear(proveedor) {
    const { nombre, telefono, correo, cuenta_bancaria, notas, creado_por } = proveedor;
    const query = `
      INSERT INTO proveedores 
        (nombre, telefono, correo, cuenta_bancaria, notas, creado_por)
      VALUES 
        ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [nombre, telefono, correo, cuenta_bancaria, notas, creado_por];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerTodos(activo = true) {
    const query = `
      SELECT p.*, u.nombre as creador_nombre 
      FROM proveedores p
      LEFT JOIN usuarios u ON p.creado_por = u.id
      WHERE p.activo = $1
      ORDER BY p.nombre
    `;
    const result = await pool.query(query, [activo]);
    return result.rows;
  }

  static async obtenerPorId(id) {
    const query = `
      SELECT p.*, u.nombre as creador_nombre 
      FROM proveedores p
      LEFT JOIN usuarios u ON p.creado_por = u.id
      WHERE p.id = $1
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
      UPDATE proveedores
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
      UPDATE proveedores
      SET activo = false
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async buscarPorNombre(nombre) {
    const query = `
      SELECT * FROM proveedores 
      WHERE nombre ILIKE $1 AND activo = true
      ORDER BY nombre
    `;
    const result = await pool.query(query, [`%${nombre}%`]);
    return result.rows;
  }
  
  static async obtenerProductos(proveedor_id) {
    const query = `
      SELECT pp.*, p.nombre AS nombre_producto, p.descripcion, p.precio, p.imagen_url
      FROM productos_proveedores pp
      JOIN productos p ON pp.producto_id = p.id
      WHERE pp.proveedor_id = $1 AND p.activo = true;
    `;
    const values = [proveedor_id];
    const result = await pool.query(query, values);
    return result.rows;
  }
}

module.exports = Proveedor;