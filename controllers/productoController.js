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
      const { nombre, descripcion, precio, id_categoria, sku, stock } = req.body;
      const imagen_url = req.file ? req.file.filename : req.body.imagen_url;
  
      // Verificar si la categoría existe si se proporcionó una
      let categoriaExistente = null;
      if (id_categoria) {
        categoriaExistente = await Categoria.obtenerPorId(id_categoria);
        if (!categoriaExistente) {
          return res.status(404).json({ msg: 'Categoría no encontrada' });
        }
      }
  
      const productoActualizado = await Producto.actualizarProducto(req.params.id, {
        nombre,
        descripcion,
        precio,
        categoria_id: id_categoria || null,
        imagen_url,
        stock,
        sku,
      });
  
      if (!productoActualizado) {
        return res.status(404).json({ msg: 'Producto no encontrado' });
      }
  
      res.status(200).json(productoActualizado);
    } catch (error) {
      res.status(500).json({ msg: 'Error al actualizar el producto', error: error.message });
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
