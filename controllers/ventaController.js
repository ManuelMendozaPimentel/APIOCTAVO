const Venta = require('../models/venta');
const Usuario = require('../models/usuarios');
const Producto = require('../models/producto');
const pool = require('../config/db');

/**
 * Crear una nueva venta.
 */
exports.crearVenta = async (req, res) => {
  try {
    const { productos, cliente } = req.body;

    // Extraer el ID del empleado del token
    const empleadoId = req.user.id;

    // Validar si el empleado existe
    const empleadoExistente = await Usuario.obtenerPorId(empleadoId);
    if (!empleadoExistente) {
      return res.status(404).json({ msg: 'Empleado no encontrado' });
    }

    // Lógica para cliente por defecto
    const clientId = cliente || process.env.DEFAULT_CLIENT_ID;

    // Validar si el cliente existe
    const clienteExistente = clientId ? await Usuario.obtenerPorId(clientId) : null;
    if (clientId && !clienteExistente) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    // Calcular total y validar stock
    let total = 0;
    const productosVerificados = [];

    for (const item of productos) {
      const producto = await Producto.obtenerProductoPorId(item.producto);
      if (!producto) {
        return res.status(404).json({ msg: `Producto ${item.producto} no encontrado` });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente para ${producto.nombre}` });
      }

      productosVerificados.push({
        producto: item.producto,
        cantidad: item.cantidad,
        precioUnitario: producto.precio
      });

      total += producto.precio * item.cantidad;
    }

    // Crear venta
    const nuevaVenta = await Venta.crear({
      cliente: clientId,
      empleado: empleadoId, // Usar el ID del empleado del token
      productos: productosVerificados,
      total,
      estado: 'completado'
    });

    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear la venta', error: error.message });
  }
};
/**
 * Obtener todas las ventas.
 */
exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.obtenerTodas();
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener ventas', error: error.message });
  }
};

/**
 * Obtener una venta por ID.
 */
exports.obtenerVentaPorId = async (req, res) => {
  try {
    const venta = await Venta.obtenerPorId(req.params.id);
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener venta', error: error.message });
  }
};

exports.obtenerVentasPorRangoFechas = async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ msg: 'Fechas de inicio y fin son requeridas' });
    }

    // Asegúrate de que las fechas sean válidas
    const fechaInicio = new Date(fecha_inicio);
    const fechaFin = new Date(fecha_fin);

    if (isNaN(fechaInicio) || isNaN(fechaFin)) {
      return res.status(400).json({ msg: 'Formato de fecha inválido' });
    }

    // Formatear fechas a YYYY-MM-DD
    const fechaInicioFormateada = fechaInicio.toISOString().split('T')[0];
    const fechaFinFormateada = fechaFin.toISOString().split('T')[0];

    const ventas = await Venta.obtenerPorRangoFechas(fechaInicioFormateada, fechaFinFormateada);
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener ventas por rango de fechas', error: error.message });
  }
};

exports.obtenerTotalesPorClienteId = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar que el ID sea un número
    if (isNaN(parseInt(id))) {
      return res.status(400).json({ msg: 'ID de cliente inválido' });
    }

    const query = `
  SELECT 
    u.nombre, 
    u.correo, 
    COALESCE(SUM(v.total), 0) AS total_gastado
  FROM usuarios u
  LEFT JOIN venta v ON u.id = v.usuario_id
  WHERE u.id = $1
  GROUP BY u.id;
`;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Cliente no encontrado' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener totales por cliente', error: error.message });
  }
};

exports.obtenerProductosMasVendidos = async (req, res) => {
  try {
    // Llamar al modelo para obtener los productos más vendidos
    const productos = await Venta.obtenerProductosMasVendidos();
    
    // Devolver la respuesta con los productos más vendidos
    res.status(200).json(productos);
  } catch (error) {
    // Manejar errores
    res.status(500).json({ msg: 'Error al obtener productos más vendidos', error: error.message });
  }
};

exports.obtenerVentasPorEstado = async (req, res) => {
  try {
    const { estado } = req.params;

    // Validar que el estado sea uno de los permitidos
    if (!['pendiente', 'completado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ msg: 'Estado no válido' });
    }

    const ventas = await Venta.obtenerPorEstado(estado);
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener ventas por estado', error: error.message });
  }
};

/**
 * Actualizar el estado de una venta.
 */
exports.actualizarEstatusVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nuevoEstatus } = req.body;

    // Validar estado permitido
    if (!['pendiente', 'completado', 'cancelado'].includes(nuevoEstatus)) {
      return res.status(400).json({ msg: 'Estado no válido' });
    }

    const venta = await Venta.actualizarEstatus(id, nuevoEstatus);
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });

    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar venta', error: error.message });
  }
};

/**
 * Eliminar una venta.
 */
exports.eliminarVenta = async (req, res) => {
  try {
    const { id } = req.params;

    // Validar si la venta existe
    const ventaExistente = await Venta.obtenerPorId(id);
    if (!ventaExistente) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    // No permitir eliminar ventas completadas
    if (ventaExistente.estado === 'completado') {
      return res.status(400).json({ msg: 'No se puede eliminar una venta completada' });
    }

    const ventaEliminada = await Venta.eliminar(id);
    res.status(200).json({ msg: 'Venta eliminada', venta: ventaEliminada });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar venta', error: error.message });
  }
};