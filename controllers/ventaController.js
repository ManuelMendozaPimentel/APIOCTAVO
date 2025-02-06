const Venta = require('../models/venta');
const Producto = require('../models/producto');
const Usuario = require('../models/usuarios');

// Crear una nueva venta
exports.crearVenta = async (req, res) => {
  try {
    const { productos, cliente, empleado } = req.body;

    // Validar que el cliente y el empleado existan
    const clienteExistente = await Usuario.findById(cliente);
    const empleadoExistente = await Usuario.findById(empleado);

    if (!clienteExistente || !empleadoExistente) {
      return res.status(404).json({ msg: 'Cliente o empleado no encontrado' });
    }

    // Calcular el total y verificar el stock de los productos
    let total = 0;
    for (const item of productos) {
      const producto = await Producto.findById(item.producto);
      if (!producto) {
        return res.status(404).json({ msg: 'Producto no encontrado' });
      }
      if (producto.stock < item.cantidad) {
        return res.status(400).json({ msg: `Stock insuficiente para el producto: ${producto.nombre}` });
      }
      total += producto.precio * item.cantidad;
    }

    // Crear la venta
    const nuevaVenta = new Venta({
      productos: productos.map((item) => ({
        producto: item.producto,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.precioUnitario * item.cantidad,
      })),
      total,
      cliente,
      empleado,
      estatus: 'completada', // Estatus inicial
    });

    // Guardar la venta en la base de datos
    await nuevaVenta.save();

    // Actualizar el stock de los productos
    for (const item of productos) {
      await Producto.findByIdAndUpdate(item.producto, { $inc: { stock: -item.cantidad } });
    }

    res.status(201).json(nuevaVenta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear la venta', error: error.message });
  }
};

// Obtener todas las ventas con información de cliente, empleado y productos
exports.obtenerVentas = async (req, res) => {
  try {
    const ventas = await Venta.find()
      .populate('cliente')
      .populate('empleado')
      .populate('productos.producto');
    res.status(200).json(ventas);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener las ventas', error: error.message });
  }
};

// Obtener una venta por ID con información de cliente, empleado y productos
exports.obtenerVentaPorId = async (req, res) => {
  try {
    const venta = await Venta.findById(req.params.id)
      .populate('cliente')
      .populate('empleado')
      .populate('productos.producto');
    if (!venta) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }
    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener la venta', error: error.message });
  }
};

// Actualizar el estatus de una venta (por ejemplo, cancelar)
exports.actualizarEstatusVenta = async (req, res) => {
  try {
    const { estatus } = req.body;
    const venta = await Venta.findByIdAndUpdate(
      req.params.id,
      { estatus },
      { new: true }
    ).populate('cliente')
     .populate('empleado')
     .populate('productos.producto');

    if (!venta) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }

    // Si la venta se cancela, devolver el stock de los productos
    if (estatus === 'cancelada') {
      for (const item of venta.productos) {
        await Producto.findByIdAndUpdate(item.producto, { $inc: { stock: item.cantidad } });
      }
    }

    res.status(200).json(venta);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar el estatus de la venta', error: error.message });
  }
};

// Eliminar una venta (opcional)
exports.eliminarVenta = async (req, res) => {
  try {
    const venta = await Venta.findByIdAndDelete(req.params.id);
    if (!venta) {
      return res.status(404).json({ msg: 'Venta no encontrada' });
    }
    res.status(200).json({ msg: 'Venta eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar la venta', error: error.message });
  }
};