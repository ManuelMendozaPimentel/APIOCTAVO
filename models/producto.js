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
  static async actualizarProducto(id, { nombre, descripcion, precio, categoria_id, imagen_url, stock, sku }) {
    const query = `
      UPDATE productos
      SET nombre = $1, descripcion = $2, precio = $3, categoria_id = $4, imagen_url = $5, stock = $6, sku = $7
      WHERE id = $8 RETURNING *;
    `;
    const values = [nombre, descripcion, precio, categoria_id, imagen_url, stock, sku, id];
    const result = await pool.query(query, values);
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
