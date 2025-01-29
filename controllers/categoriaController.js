const Categoria = require('../models/categoria');

// Crear una nueva categoría
exports.crearCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        // Verificar si la categoría ya existe
        const categoriaExistente = await Categoria.findOne({ nombre });
        if (categoriaExistente) {
            return res.status(400).json({ msg: 'La categoría ya existe' });
        }

        const nuevaCategoria = new Categoria({
            nombre,
            descripcion
        });

        await nuevaCategoria.save();
        res.status(201).json(nuevaCategoria);
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear la categoría', error: error.message });
    }
};

// Obtener todas las categorías
exports.obtenerCategorias = async (req, res) => {
    try {
        const categorias = await Categoria.find();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener las categorías', error: error.message });
    }
};

// Obtener una categoría por ID
exports.obtenerCategoriaPorId = async (req, res) => {
    try {
        const categoria = await Categoria.findById(req.params.id);
        if (!categoria) {
            return res.status(404).json({ msg: 'Categoría no encontrada' });
        }
        res.status(200).json(categoria);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener la categoría', error: error.message });
    }
};

// Actualizar una categoría
exports.actualizarCategoria = async (req, res) => {
    try {
        const { nombre, descripcion } = req.body;

        const categoriaActualizada = await Categoria.findByIdAndUpdate(
            req.params.id,
            {
                nombre,
                descripcion
            },
            { new: true }
        );

        if (!categoriaActualizada) {
            return res.status(404).json({ msg: 'Categoría no encontrada' });
        }

        res.status(200).json(categoriaActualizada);
    } catch (error) {
        res.status(500).json({ msg: 'Error al actualizar la categoría', error: error.message });
    }
};

// Eliminar una categoría
exports.eliminarCategoria = async (req, res) => {
    try {
        const categoriaEliminada = await Categoria.findByIdAndDelete(req.params.id);
        if (!categoriaEliminada) {
            return res.status(404).json({ msg: 'Categoría no encontrada' });
        }
        res.status(200).json({ msg: 'Categoría eliminada correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar la categoría', error: error.message });
    }
};