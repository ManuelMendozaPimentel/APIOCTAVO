// models/producto.js
const pool = require('../config/db');

class Producto {
  // Crear un nuevo producto
  static async crearProducto({ nombre, descripcion, precio, categoria_id, imagen_url, stock, sku }) {
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, categoria_id, imagen_url, stock, sku)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;
    `;
    const values = [nombre, descripcion, precio, categoria_id, imagen_url, stock, sku];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  // Obtener todos los productos
  static async obtenerProductos() {
    const query = `
      SELECT p.*, c.nombre AS nombre_categoria, c.descripcion AS descripcion_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id;
    `;
    const result = await pool.query(query);
    return result.rows;
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
    const query = `
      SELECT p.*, c.nombre AS nombre_categoria, c.descripcion AS descripcion_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE p.nombre ILIKE $1;
    `;
    const values = [`%${nombre}%`];
    const result = await pool.query(query, values);
    return result.rows;
  }

  // Actualizar un producto
static async actualizarProducto(id, datos) {
  const updates = [];
  const values = [];
  let paramIndex = 1;

  // Construir dinámicamente la consulta SQL
  for (const [key, value] of Object.entries(datos)) {
    if (value !== undefined && value !== null) {
      updates.push(`${key} = $${paramIndex}`);
      values.push(value);
      paramIndex++;
    }
  }

  // Si no hay campos para actualizar, lanzar un error
  if (updates.length === 0) {
    throw new Error('No se proporcionaron campos para actualizar');
  }

  // Agregar el ID del producto al final de los valores
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

//aumentar el stock disponible
 static async aumentarStock(id, cantidad) {
    if (typeof cantidad !== 'number' || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número positivo');
    }

    const query = `
      UPDATE productos
      SET stock = stock + $1
      WHERE id = $2 RETURNING *;
    `;
    const values = [cantidad, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    return result.rows[0];
 }

  static async ajustarStock(id, cantidad) {
    if (typeof cantidad !== 'number' || cantidad < 0) {
      throw new Error('La cantidad debe ser un número positivo o cero');
    }

    const query = `
      UPDATE productos
      SET stock = $1
      WHERE id = $2 RETURNING *;
    `;
    const values = [cantidad, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    return result.rows[0];
  }

  // Reducir stock
  static async reducirStock(id, cantidad) {
    if (typeof cantidad !== 'number' || cantidad <= 0) {
      throw new Error('La cantidad debe ser un número positivo');
    }

    const query = `
      UPDATE productos
      SET stock = stock - $1
      WHERE id = $2 RETURNING *;
    `;
    const values = [cantidad, id];
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Producto no encontrado');
    }

    return result.rows[0];
  }
  // Eliminar un producto
  static async eliminarProducto(id) {
    const query = 'DELETE FROM productos WHERE id = $1 RETURNING *;';
    const values = [id];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}

module.exports = Producto;
