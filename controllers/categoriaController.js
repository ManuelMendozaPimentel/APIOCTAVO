// controllers/categoriaController.js

const Categoria = require('../models/categoria');

// Crear una nueva categoría
exports.crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;

    // Verificar si la categoría ya existe
    const categoriaExistente = await Categoria.obtenerPorNombre(nombre);
    if (categoriaExistente) {
      return res.status(400).json({ msg: 'La categoría ya existe' });
    }

    const nuevaCategoria = await Categoria.crear({ nombre, descripcion });

    res.status(201).json(nuevaCategoria);
  } catch (error) {
    console.error('Error al crear la categoría:', error);
    res.status(500).json({ msg: 'Error al crear la categoría', error: error.message });
  }
};

// Obtener todas las categorías
exports.obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.obtenerTodas();
    res.status(200).json(categorias);
  } catch (error) {
    console.error('Error al obtener las categorías:', error);
    res.status(500).json({ msg: 'Error al obtener las categorías', error: error.message });
  }
};

// Obtener una categoría por ID
exports.obtenerCategoriaPorId = async (req, res) => {
  try {
    const categoria = await Categoria.obtenerPorId(req.params.id);
    if (!categoria) {
      return res.status(404).json({ msg: 'Categoría no encontrada' });
    }
    res.status(200).json(categoria);
  } catch (error) {
    console.error('Error al obtener la categoría:', error);
    res.status(500).json({ msg: 'Error al obtener la categoría', error: error.message });
  }
};

// Actualizar una categoría
exports.actualizarCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    const { id } = req.params;

    const categoriaActualizada = await Categoria.actualizar(id, { nombre, descripcion });

    if (!categoriaActualizada) {
      return res.status(404).json({ msg: 'Categoría no encontrada' });
    }

    res.status(200).json(categoriaActualizada);
  } catch (error) {
    console.error('Error al actualizar la categoría:', error);
    res.status(500).json({ msg: 'Error al actualizar la categoría', error: error.message });
  }
};

// Eliminar una categoría
exports.eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    const categoriaEliminada = await Categoria.eliminar(id);
    if (!categoriaEliminada) {
      return res.status(404).json({ msg: 'Categoría no encontrada' });
    }
    res.status(200).json({ msg: 'Categoría eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar la categoría:', error);
    res.status(500).json({ msg: 'Error al eliminar la categoría', error: error.message });
  }
};
