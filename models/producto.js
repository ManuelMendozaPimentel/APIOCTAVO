const pool = require('../config/db');

class Producto {
  // Crear un nuevo producto
  static async crearProducto({ nombre, descripcion, precio, categoria_id, imagen_url, stock, sku, creado_por }) {
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, categoria_id, imagen_url, stock, sku, creado_por)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;
    `;
    const values = [nombre, descripcion, precio, categoria_id, imagen_url, stock, sku, creado_por];
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.constraint === 'productos_sku_key') {
        throw new Error('El SKU ya está registrado');
      }
      throw error;
    }
  }

  static async obtenerProductos({ page = 1, limit = 10, categoria_id, min_precio, max_precio, disponible, activo } = {}) {
    // Validar parámetros
    if (isNaN(page) || page < 1) throw new Error('El parámetro "page" debe ser un número entero positivo');
    if (isNaN(limit) || limit < 1) throw new Error('El parámetro "limit" debe ser un número entero positivo');
  
    let query = `
      SELECT p.*, c.nombre AS nombre_categoria, c.descripcion AS descripcion_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const values = [];
    let paramIndex = 1;
  
    // Filtros
    if (categoria_id) {
      query += ` AND p.categoria_id = $${paramIndex}`;
      values.push(parseInt(categoria_id, 10));
      paramIndex++;
    }
  
    if (min_precio) {
      query += ` AND p.precio >= $${paramIndex}`;
      values.push(parseFloat(min_precio));
      paramIndex++;
    }
  
    if (max_precio) {
      query += ` AND p.precio <= $${paramIndex}`;
      values.push(parseFloat(max_precio));
      paramIndex++;
    }
  
    if (disponible === 'true' || disponible === true) {
      query += ` AND p.stock > 0`;
    }
  
    if (activo !== undefined) {
      query += ` AND p.activo = $${paramIndex}`;
      values.push(activo === 'true');
      paramIndex++;
    }
  
    // Paginación
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    values.push(parseInt(limit, 10), (parseInt(page, 10) - 1) * parseInt(limit, 10));
  
    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al obtener los productos: ${error.message}`);
    }
  }

  // Obtener un producto por ID
  static async obtenerProductoPorId(id) {
    const query = `
      SELECT p.*, c.nombre AS nombre_categoria, c.descripcion AS descripcion_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.id = $1;
    `;
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Buscar productos por nombre
  static async buscarProductosPorNombre(nombre) {
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      throw new Error('El nombre debe ser una cadena de texto válida');
    }

    const query = `
      SELECT p.*, c.nombre AS nombre_categoria, c.descripcion AS descripcion_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.nombre ILIKE $1;
    `;
    const values = [`%${nombre.trim()}%`];

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      throw new Error(`Error al buscar productos por nombre: ${error.message}`);
    }
  }

  // Actualizar un producto
  static async actualizarProducto(id, datos) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(datos)) {
      if (value !== undefined && value !== null) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No se proporcionaron campos para actualizar');
    }

    values.push(id);
    const query = `
      UPDATE productos
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async aumentarStock(id, cantidad, modificadoPor) {
    if (typeof cantidad !== 'number' || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número positivo');
    }
    const query = `
      UPDATE productos
      SET stock = stock + $1, modificado_por = $3
      WHERE id = $2 RETURNING *;
    `;
    const values = [cantidad, id, modificadoPor];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    return result.rows[0];
  }

  static async ajustarStock(id, cantidad, modificadoPor) {
    if (typeof cantidad !== 'number' || cantidad < 0) {
      throw new Error('La cantidad debe ser un número positivo o cero');
    }
    const query = `
      UPDATE productos
      SET stock = $1, modificado_por = $3
      WHERE id = $2 RETURNING *;
    `;
    const values = [cantidad, id, modificadoPor];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    return result.rows[0];
  }
  static async reducirStock(id, cantidad, modificadoPor) {
    if (typeof cantidad !== 'number' || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número positivo');
    }
    const query = `
      UPDATE productos
      SET stock = GREATEST(stock - $1, 0), modificado_por = $3
      WHERE id = $2 RETURNING *;
    `;
    const values = [cantidad, id, modificadoPor];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    return result.rows[0];
  }

  static async eliminarProducto(id, modificadoPor) {
    const query = `
      UPDATE productos
      SET activo = FALSE, modificado_por = $2
      WHERE id = $1 RETURNING *;
    `;
    const values = [id, modificadoPor];
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }
    return result.rows[0];
  }

  // Obtener producto por SKU
  static async obtenerProductoPorSku(sku) {
    const query = 'SELECT * FROM productos WHERE sku = $1';
    const values = [sku];
    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error('Error al verificar el SKU');
    }
  }

  // Registrar cambio en la auditoría de productos
static async registrarAuditoriaProducto(producto_id, usuario_id, accion, detalles) {
  const query = `
    INSERT INTO auditoria_productos (producto_id, usuario_id, accion, detalles)
    VALUES ($1, $2, $3, $4) RETURNING *;
  `;
  const values = [producto_id, usuario_id, accion, detalles];
  await pool.query(query, values);
}

// Registrar cambio en el historial de stock
static async registrarHistorialStock(producto_id, usuario_id, cantidad_anterior, cantidad_nueva, motivo) {
  const query = `
    INSERT INTO historial_stock (producto_id, usuario_id, cantidad_anterior, cantidad_nueva, motivo)
    VALUES ($1, $2, $3, $4, $5) RETURNING *;
  `;
  const values = [producto_id, usuario_id, cantidad_anterior, cantidad_nueva, motivo];
  await pool.query(query, values);
}

static async obtenerHistorialStock(producto_id) {
  const query = `
    SELECT * FROM historial_stock
    WHERE producto_id = $1
    ORDER BY fecha DESC;
  `;
  const values = [producto_id];
  const result = await pool.query(query, values);
  return result.rows;
}

static async obtenerAuditoriaProducto(producto_id) {
  const query = `
    SELECT * FROM auditoria_productos
    WHERE producto_id = $1
    ORDER BY fecha DESC;
  `;
  const values = [producto_id];
  const result = await pool.query(query, values);
  return result.rows;
}


}


module.exports = Producto;