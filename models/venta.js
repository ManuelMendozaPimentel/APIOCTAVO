const pool = require('../config/db');

class Venta {
  static async crear(ventaData) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insertar en venta
      const ventaQuery = `
        INSERT INTO venta (usuario_id, empleado_id, total, estado)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const ventaValues = [
        ventaData.cliente,
        ventaData.empleado,
        ventaData.total,
        ventaData.estatus || 'completada'
      ];
      const ventaResult = await client.query(ventaQuery, ventaValues);
      const venta = ventaResult.rows[0];

     // Insertar detalles de la venta
for (const item of ventaData.productos) {
  const detalleQuery = `
    INSERT INTO detalles_venta (pedido_id, producto_id, cantidad, precio_unitario)
    VALUES ($1, $2, $3, $4)
  `;
  await client.query(detalleQuery, [venta.id, item.producto, item.cantidad, item.precioUnitario]);

  // Actualizar stock
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
               WHERE dv.pedido_id = v.id
             ) as productos
      FROM venta v
      LEFT JOIN usuarios c ON v.usuario_id = c.id
      LEFT JOIN usuarios e ON v.empleado_id = e.id;
    `;
    const result = await pool.query(query);
    return result.rows;
  }

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
               WHERE dv.pedido_id = v.id
             ) as productos
      FROM venta v
      LEFT JOIN usuarios c ON v.usuario_id = c.id
      LEFT JOIN usuarios e ON v.empleado_id = e.id
      WHERE v.id = $1;
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  static async actualizarEstatus(id, nuevoEstatus) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      const venta = await this.obtenerPorId(id);
      
      const updateQuery = `
        UPDATE venta
        SET estado = $1
        WHERE id = $2
        RETURNING *;
      `;
      const result = await client.query(updateQuery, [nuevoEstatus, id]);
      
      if (nuevoEstatus === 'cancelada') {
        for (const item of venta.productos) {
          await client.query(
            'UPDATE productos SET stock = stock + $1 WHERE id = $2',
            [item.cantidad, item.producto_id]
          );
        }
      }
      
      await client.query('COMMIT');
      return result.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async eliminar(id) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
  
      // Obtener el estado de la venta
      const estadoQuery = `
        SELECT estado
        FROM venta
        WHERE id = $1;
      `;
      const estadoResult = await client.query(estadoQuery, [id]);
  
      if (estadoResult.rows.length === 0) {
        throw new Error('Venta no encontrada');
      }
  
      const estado = estadoResult.rows[0].estado;
  
      // Si el estado es "cancelado", no actualizar el stock
      let detalles = [];
      if (estado !== 'cancelado') {
        // Obtener los detalles de la venta para ajustar el stock
        const detallesQuery = `
          SELECT producto_id, cantidad
          FROM detalles_venta
          WHERE pedido_id = $1;
        `;
        const detallesResult = await client.query(detallesQuery, [id]);
        detalles = detallesResult.rows;
  
        // Actualizar el stock de los productos
        for (const detalle of detalles) {
          await client.query(
            'UPDATE productos SET stock = stock + $1 WHERE id = $2',
            [detalle.cantidad, detalle.producto_id]
          );
        }
      }
  
      // Eliminar los detalles de la venta
      await client.query('DELETE FROM detalles_venta WHERE pedido_id = $1', [id]);
  
      // Eliminar la venta
      const ventaQuery = 'DELETE FROM venta WHERE id = $1 RETURNING *';
      const ventaResult = await client.query(ventaQuery, [id]);
  
      await client.query('COMMIT');
  
      return ventaResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Venta;