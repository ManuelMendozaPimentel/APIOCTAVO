const Venta = require('../models/venta');
const Usuario = require('../models/usuarios');
const Producto = require('../models/producto');

exports.crearVenta = async (req, res) => {
  try {
    const { productos, cliente, empleado } = req.body;
    
    // Lógica para cliente por defecto
    const clientId = cliente || process.env.DEFAULT_CLIENT_ID;

    // Validar usuarios
    const [clienteExistente, empleadoExistente] = await Promise.all([
      clientId ? Usuario.obtenerPorId(clientId) : Promise.resolve(null),
      Usuario.obtenerPorId(empleado)
    ]);
    
    if (!empleadoExistente) {
      return res.status(404).json({ msg: 'Empleado no encontrado' });
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
      empleado: empleadoExistente.id,
      productos: productosVerificados,
      total,
      estatus: 'completado'
    });

    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear la venta', error: error.message });
  }
};

// Los demás métodos del controlador permanecen igual...

exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.obtenerTodas();
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener ventas', error: error.message });
  }
};

exports.obtenerVentaPorId = async (req, res) => {
  try {
    const venta = await Venta.obtenerPorId(req.params.id);
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener venta', error: error.message });
  }
};

exports.actualizarEstatusVenta = async (req, res) => {
  try {
    const venta = await Venta.actualizarEstatus(req.params.id, req.body.estatus);
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar venta', error: error.message });
  }
};

exports.eliminarVenta = async (req, res) => {
  try {
    const venta = await Venta.eliminar(req.params.id);
    if (!venta) return res.status(404).json({ msg: 'Venta no encontrada' });
    res.status(200).json({ msg: 'Venta eliminada', venta });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar venta', error: error.message });
  }
};