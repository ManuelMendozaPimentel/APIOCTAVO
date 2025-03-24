const pool = require('../config/db');

class Direccion {
  static async crear(direccion) {
    const { calle, numero_exterior, numero_interior, colonia, municipio, estado, codigo_postal, pais, referencias, tipo, principal, usuario_id, proveedor_id } = direccion;
    
    const query = `
      INSERT INTO direcciones 
        (calle, numero_exterior, numero_interior, colonia, municipio, estado, codigo_postal, pais, referencias, tipo, principal, usuario_id, proveedor_id)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [calle, numero_exterior, numero_interior, colonia, municipio, estado, codigo_postal, pais, referencias, tipo, principal, usuario_id, proveedor_id];
    
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async obtenerPorId(id) {
    const query = 'SELECT * FROM direcciones WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async obtenerPorUsuario(usuario_id) {
    const query = 'SELECT * FROM direcciones WHERE usuario_id = $1 ORDER BY principal DESC';
    const result = await pool.query(query, [usuario_id]);
    return result.rows;
  }

  static async obtenerPorProveedor(proveedor_id) {
    const query = 'SELECT * FROM direcciones WHERE proveedor_id = $1 ORDER BY principal DESC';
    const result = await pool.query(query, [proveedor_id]);
    return result.rows;
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
      UPDATE direcciones
      SET ${campos.join(', ')}
      WHERE id = $${indice}
      RETURNING *
    `;
    valores.push(id);
    const result = await pool.query(query, valores);
    return result.rows[0];
  }

  static async eliminar(id) {
    const query = 'DELETE FROM direcciones WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async marcarComoPrincipal(id, usuario_id) {
    // Primero quitar principal de todas las direcciones del usuario
    await pool.query(
      'UPDATE direcciones SET principal = false WHERE usuario_id = $1',
      [usuario_id]
    );
    
    // Luego marcar la dirección específica como principal
    const query = 'UPDATE direcciones SET principal = true WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = Direccion;