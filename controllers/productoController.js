// controllers/productoController.js
const Producto = require('../models/producto');
const Categoria = require('../models/categoria');
const path = require('path');

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
    try {
      const { nombre, descripcion, precio, id_categoria, sku, stock } = req.body; // Ajustado a id_categoria
      const imagen_url = req.file ? req.file.filename : req.body.imagen_url; // Ajustado para obtener de req.body si no hay archivo
  
      // Verificar si la categoría existe si se proporcionó una
      let categoriaExistente = null;
      if (id_categoria) {
        categoriaExistente = await Categoria.obtenerPorId(id_categoria);
        if (!categoriaExistente) {
          return res.status(404).json({ msg: 'Categoría no encontrada' });
        }
      }
  
      const nuevoProducto = await Producto.crearProducto({
        nombre,
        descripcion,
        precio,
        categoria_id: id_categoria || null, // Ajustado a id_categoria
        imagen_url,
        stock,
        sku,
      });
  
      res.status(201).json(nuevoProducto);
    } catch (error) {
      res.status(500).json({ msg: 'Error al crear el producto', error: error.message });
    }
};
    

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    const productos = await Producto.obtenerProductos();
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener los productos', error: error.message });
  }
};

// Obtener un producto por ID
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener el producto', error: error.message });
  }
};

// Buscar productos por nombre
exports.buscarProductosPorNombre = async (req, res) => {
  try {
    const nombre = req.query.nombre;
    const productos = await Producto.buscarProductosPorNombre(nombre);
    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al buscar productos', error: error.message });
  }
};

// Actualizar un producto
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Validar que se haya proporcionado al menos un campo para actualizar
    if (Object.keys(datosActualizacion).length === 0) {
      return res.status(400).json({ msg: 'Debes proporcionar al menos un campo para actualizar' });
    }

    // Actualizar el producto
    const productoActualizado = await Producto.actualizarProducto(id, datosActualizacion);

    if (!productoActualizado) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar el producto', error: error.message });
  }
};


exports.aumentarStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio' });
    }

    const productoActualizado = await Producto.aumentarStock(id, cantidad);
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al aumentar el stock', error: error.message });
  }
};
exports.ajustarStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio' });
    }

    const productoActualizado = await Producto.ajustarStock(id, cantidad);
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al ajustar el stock', error: error.message });
  }
};

exports.reducirStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio' });
    }

    const productoActualizado = await Producto.reducirStock(id, cantidad);
    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al reducir el stock', error: error.message });
  }
};
// Eliminar un producto
exports.eliminarProducto = async (req, res) => {
  try {
    const productoEliminado = await Producto.eliminarProducto(req.params.id);
    if (!productoEliminado) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.status(200).json({ msg: 'Producto eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar el producto', error: error.message });
  }
};
