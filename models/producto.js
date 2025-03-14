const pool = require('../config/db');

class Producto {
  /**
   * Crea un nuevo producto en la base de datos.
   * Escenarios cubiertos:
   * - Creación exitosa de un producto.
   * - Validación de SKU único (evita duplicados).
   * 
   * Validaciones:
   * - El SKU debe ser único (se lanza un error si ya existe).
   * 
   * @param {Object} datos - Datos del producto (nombre, descripcion, precio, categoria_id, imagen_url, stock, sku, creado_por).
   * @returns {Object} - El producto creado.
   */
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

  /**
   * Obtiene una lista de productos con paginación y filtros opcionales.
   * Escenarios cubiertos:
   * - Obtener todos los productos.
   * - Filtrar por categoría, precio mínimo, precio máximo, disponibilidad y estado activo/inactivo.
   * 
   * Validaciones:
   * - `page` y `limit` deben ser números enteros positivos.
   * 
   * @param {Object} opciones - Opciones de filtrado y paginación (page, limit, categoria_id, min_precio, max_precio, disponible, activo).
   * @returns {Array} - Lista de productos.
   */
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

  /**
   * Obtiene un producto por su ID.
   * Escenarios cubiertos:
   * - Obtener un producto existente.
   * - Producto no encontrado.
   * 
   * @param {number} id - ID del producto.
   * @returns {Object} - El producto encontrado.
   */
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

  /**
   * Busca productos por nombre (búsqueda insensible a mayúsculas/minúsculas).
   * Escenarios cubiertos:
   * - Búsqueda exitosa.
   * - Validación de nombre vacío o inválido.
   * 
   * Validaciones:
   * - El nombre debe ser una cadena de texto no vacía.
   * 
   * @param {string} nombre - Nombre o parte del nombre del producto.
   * @returns {Array} - Lista de productos que coinciden con la búsqueda.
   */
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

  /**
   * Actualiza un producto existente.
   * Escenarios cubiertos:
   * - Actualización exitosa.
   * - Validación de campos vacíos o no permitidos.
   * 
   * Validaciones:
   * - Se debe proporcionar al menos un campo para actualizar.
   * 
   * @param {number} id - ID del producto.
   * @param {Object} datos - Campos a actualizar (nombre, descripcion, precio, stock, imagen_url, categoria_id).
   * @returns {Object} - El producto actualizado.
   */
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

  /**
   * Aumenta el stock de un producto.
   * Escenarios cubiertos:
   * - Aumento exitoso del stock.
   * - Validación de cantidad inválida.
   * 
   * Validaciones:
   * - La cantidad debe ser un número positivo.
   * 
   * @param {number} id - ID del producto.
   * @param {number} cantidad - Cantidad a aumentar.
   * @param {number} modificadoPor - ID del usuario que realiza la modificación.
   * @returns {Object} - El producto con el stock actualizado.
   */
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

  /**
   * Ajusta el stock de un producto a un valor específico.
   * Escenarios cubiertos:
   * - Ajuste exitoso del stock.
   * - Validación de cantidad inválida.
   * 
   * Validaciones:
   * - La cantidad debe ser un número no negativo.
   * 
   * @param {number} id - ID del producto.
   * @param {number} cantidad - Nuevo valor del stock.
   * @param {number} modificadoPor - ID del usuario que realiza la modificación.
   * @returns {Object} - El producto con el stock actualizado.
   */
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

  /**
   * Reduce el stock de un producto.
   * Escenarios cubiertos:
   * - Reducción exitosa del stock.
   * - Validación de cantidad inválida o insuficiente stock.
   * 
   * Validaciones:
   * - La cantidad debe ser un número positivo.
   * - El stock no puede ser menor que la cantidad a reducir.
   * 
   * @param {number} id - ID del producto.
   * @param {number} cantidad - Cantidad a reducir.
   * @param {number} modificadoPor - ID del usuario que realiza la modificación.
   * @returns {Object} - El producto con el stock actualizado.
   */
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

  /**
   * Marca un producto como inactivo (eliminación lógica).
   * Escenarios cubiertos:
   * - Marcado exitoso como inactivo.
   * - Validación de producto no encontrado.
   * 
   * @param {number} id - ID del producto.
   * @param {number} modificadoPor - ID del usuario que realiza la modificación.
   * @returns {Object} - El producto marcado como inactivo.
   */
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

  /**
   * Obtiene un producto por su SKU.
   * Escenarios cubiertos:
   * - Producto encontrado.
   * - Producto no encontrado.
   * 
   * @param {string} sku - SKU del producto.
   * @returns {Object} - El producto encontrado.
   */
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

  /**
   * Registra un cambio en la auditoría de productos.
   * Escenarios cubiertos:
   * - Registro exitoso de la acción en la auditoría.
   * 
   * @param {number} producto_id - ID del producto.
   * @param {number} usuario_id - ID del usuario que realiza la acción.
   * @param {string} accion - Tipo de acción (crear, actualizar, eliminar_logico).
   * @param {Object} detalles - Detalles del cambio (puede ser un objeto JSON).
   */
  static async registrarAuditoriaProducto(producto_id, usuario_id, accion, detalles) {
    const query = `
      INSERT INTO auditoria_productos (producto_id, usuario_id, accion, detalles)
      VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const values = [producto_id, usuario_id, accion, detalles];
    await pool.query(query, values);
  }

  /**
   * Registra un cambio en el historial de stock.
   * Escenarios cubiertos:
   * - Registro exitoso del cambio en el historial de stock.
   * 
   * @param {number} producto_id - ID del producto.
   * @param {number} usuario_id - ID del usuario que realiza la acción.
   * @param {number} cantidad_anterior - Cantidad de stock antes del cambio.
   * @param {number} cantidad_nueva - Cantidad de stock después del cambio.
   * @param {string} motivo - Motivo del cambio (ej: "Aumento de stock").
   */
  static async registrarHistorialStock(producto_id, usuario_id, cantidad_anterior, cantidad_nueva, motivo) {
    const query = `
      INSERT INTO historial_stock (producto_id, usuario_id, cantidad_anterior, cantidad_nueva, motivo)
      VALUES ($1, $2, $3, $4, $5) RETURNING *;
    `;
    const values = [producto_id, usuario_id, cantidad_anterior, cantidad_nueva, motivo];
    await pool.query(query, values);
  }

  /**
   * Obtiene el historial de cambios en el stock de un producto.
   * Escenarios cubiertos:
   * - Historial encontrado.
   * - Historial vacío (sin cambios registrados).
   * 
   * @param {number} producto_id - ID del producto.
   * @returns {Array} - Lista de cambios en el historial de stock.
   */
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

  /**
   * Obtiene la auditoría de cambios de un producto.
   * Escenarios cubiertos:
   * - Auditoría encontrada.
   * - Auditoría vacía (sin cambios registrados).
   * 
   * @param {number} producto_id - ID del producto.
   * @returns {Array} - Lista de cambios en la auditoría.
   */
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