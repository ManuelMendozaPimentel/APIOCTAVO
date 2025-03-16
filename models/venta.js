const pool = require('../config/db');

class Venta {
  /**
   * Crear una nueva venta.
   * @param {Object} ventaData - Datos de la venta.
   * @returns {Object} - La venta creada.
   */
  static async crear(ventaData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insertar en la tabla `venta`
      const ventaQuery = `
        INSERT INTO venta (usuario_id, empleado_id, total, estado)
        VALUES ($1, $2, $3, 'completado') -- Estado siempre será "completada"
        RETURNING *;
      `;
      const ventaValues = [
        ventaData.cliente || process.env.DEFAULT_CLIENT_ID, // Cliente frecuente si no se especifica
        ventaData.empleado,
        ventaData.total
      ];
      const ventaResult = await client.query(ventaQuery, ventaValues);
      const venta = ventaResult.rows[0];

      // Insertar detalles de la venta
      for (const item of ventaData.productos) {
        const detalleQuery = `
          INSERT INTO detalles_venta (venta_id, producto_id, cantidad, precio_unitario)
          VALUES ($1, $2, $3, $4);
        `;
        await client.query(detalleQuery, [
          venta.id,
          item.producto,
          item.cantidad,
          item.precioUnitario
        ]);

        // Actualizar stock del producto
        await client.query(
          'UPDATE productos SET stock = stock - $1 WHERE id = $2',
          [item.cantidad, item.producto]
        );
      }

      await client.query('COMMIT');
      return venta;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Obtener todas las ventas.
   * @returns {Array} - Lista de ventas con detalles.
   */
  static async obtenerTodas() {
    const query = `
      SELECT v.*, 
             jsonb_build_object(
               'id', c.id,
               'nombre', c.nombre,
               'correo', c.correo
             ) as cliente,
             jsonb_build_object(
               'id', e.id,
               'nombre', e.nombre,
               'correo', e.correo
             ) as empleado,
             (
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'producto_id', dv.producto_id,
                   'nombre', pr.nombre,
                   'cantidad', dv.cantidad,
                   'precio_unitario', dv.precio_unitario,
                   'subtotal', dv.cantidad * dv.precio_unitario
                 )
               )
               FROM detalles_venta dv
               JOIN productos pr ON dv.producto_id = pr.id
               WHERE dv.venta_id = v.id
             ) as productos
      FROM venta v
      LEFT JOIN usuarios c ON v.usuario_id = c.id
      LEFT JOIN usuarios e ON v.empleado_id = e.id;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  /**
   * Obtener una venta por ID.
   * @param {number} id - ID de la venta.
   * @returns {Object|null} - La venta encontrada o null si no existe.
   */
  static async obtenerPorId(id) {
    const query = `
      SELECT v.*, 
             jsonb_build_object(
               'id', c.id,
               'nombre', c.nombre,
               'correo', c.correo
             ) as cliente,
             jsonb_build_object(
               'id', e.id,
               'nombre', e.nombre,
               'correo', e.correo
             ) as empleado,
             (
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'producto_id', dv.producto_id,
                   'nombre', pr.nombre,
                   'cantidad', dv.cantidad,
                   'precio_unitario', dv.precio_unitario,
                   'subtotal', dv.cantidad * dv.precio_unitario
                 )
               )
               FROM detalles_venta dv
               JOIN productos pr ON dv.producto_id = pr.id
               WHERE dv.venta_id = v.id
             ) as productos
      FROM venta v
      LEFT JOIN usuarios c ON v.usuario_id = c.id
      LEFT JOIN usuarios e ON v.empleado_id = e.id
      WHERE v.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  /**
   * Eliminar una venta (solo si está cancelada).
   * @param {number} id - ID de la venta.
   * @returns {Object|null} - La venta eliminada o null si no existe.
   */
  static async eliminar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Verificar si la venta existe
      const ventaQuery = 'SELECT estado FROM venta WHERE id = $1';
      const ventaResult = await client.query(ventaQuery, [id]);

      if (ventaResult.rows.length === 0) {
        throw new Error('Venta no encontrada');
      }

      const estado = ventaResult.rows[0].estado;

      // No permitir eliminar ventas completadas
      if (estado === 'completado') {
        throw new Error('No se puede eliminar una venta completada');
      }

      // Eliminar los detalles de la venta
      await client.query('DELETE FROM detalles_venta WHERE venta_id = $1', [id]);

      // Eliminar la venta
      const deleteQuery = 'DELETE FROM venta WHERE id = $1 RETURNING *';
      const deleteResult = await client.query(deleteQuery, [id]);

      await client.query('COMMIT');
      return deleteResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

   // NUEVO: Obtener ventas por rango de fechas
   static async obtenerPorRangoFechas(fechaInicio, fechaFin) {
    const query = `
      SELECT v.*, 
             jsonb_build_object(
               'id', c.id,
               'nombre', c.nombre,
               'correo', c.correo
             ) as cliente,
             jsonb_build_object(
               'id', e.id,
               'nombre', e.nombre,
               'correo', e.correo
             ) as empleado,
             (
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'producto_id', dv.producto_id,
                   'nombre', pr.nombre,
                   'cantidad', dv.cantidad,
                   'precio_unitario', dv.precio_unitario,
                   'subtotal', dv.cantidad * dv.precio_unitario
                 )
               )
               FROM detalles_venta dv
               JOIN productos pr ON dv.producto_id = pr.id
               WHERE dv.venta_id = v.id
             ) as productos
      FROM venta v
      LEFT JOIN usuarios c ON v.usuario_id = c.id
      LEFT JOIN usuarios e ON v.empleado_id = e.id
      WHERE DATE(v.fecha_creacion) BETWEEN $1 AND $2;
    `;
    const result = await pool.query(query, [fechaInicio, fechaFin]);
    return result.rows;
  }

  // NUEVO: Obtener ventas por estado
  static async obtenerPorEstado(estado) {
    const query = `
      SELECT v.*, 
             jsonb_build_object(
               'id', c.id,
               'nombre', c.nombre,
               'correo', c.correo
             ) as cliente,
             jsonb_build_object(
               'id', e.id,
               'nombre', e.nombre,
               'correo', e.correo
             ) as empleado,
             (
               SELECT jsonb_agg(
                 jsonb_build_object(
                   'producto_id', dv.producto_id,
                   'nombre', pr.nombre,
                   'cantidad', dv.cantidad,
                   'precio_unitario', dv.precio_unitario,
                   'subtotal', dv.cantidad * dv.precio_unitario
                 )
               )
               FROM detalles_venta dv
               JOIN productos pr ON dv.producto_id = pr.id
               WHERE dv.venta_id = v.id
             ) as productos
      FROM venta v
      LEFT JOIN usuarios c ON v.usuario_id = c.id
      LEFT JOIN usuarios e ON v.empleado_id = e.id
      WHERE v.estado = $1;
    `;
    const result = await pool.query(query, [estado]);
    return result.rows;
  }

  // NUEVO: Obtener totales por cliente
  static async obtenerTotalesPorCliente() {
    const query = `
      SELECT u.nombre, u.correo, SUM(v.total) AS total_gastado
      FROM venta v
      LEFT JOIN usuarios u ON v.usuario_id = u.id
      GROUP BY u.id;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // NUEVO: Obtener productos más vendidos
  static async obtenerProductosMasVendidos() {
    const query = `
      SELECT p.nombre, SUM(dv.cantidad) AS total_vendido
      FROM detalles_venta dv
      JOIN productos p ON dv.producto_id = p.id
      GROUP BY p.id
      ORDER BY total_vendido DESC;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

}

module.exports = Venta;