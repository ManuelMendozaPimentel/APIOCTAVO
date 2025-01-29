const Producto = require('../models/producto');
const Categoria = require('../models/categoria');

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen_url, stock, id_categoria } = req.body;

        // Verificar si la categoría existe
        const categoriaExistente = await Categoria.findById(id_categoria);
        if (!categoriaExistente) {
            return res.status(404).json({ msg: 'Categoría no encontrada' });
        }

        const nuevoProducto = new Producto({
            nombre,
            descripcion,
            precio,
            imagen_url,
            stock,
            id_categoria
        });

        await nuevoProducto.save();
        res.status(201).json(nuevoProducto);
    } catch (error) {
        res.status(500).json({ msg: 'Error al crear el producto', error: error.message });
    }
};

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
    try {
        const productos = await Producto.find().populate('id_categoria');
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener los productos', error: error.message });
    }
};

// Obtener un producto por ID
exports.obtenerProductoPorId = async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id).populate('id_categoria');
        if (!producto) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }
        res.status(200).json(producto);
    } catch (error) {
        res.status(500).json({ msg: 'Error al obtener el producto', error: error.message });
    }
};

// Actualizar un producto
exports.actualizarProducto = async (req, res) => {
    try {
        const { nombre, descripcion, precio, imagen_url, stock, id_categoria } = req.body;

        // Verificar si la categoría existe
        const categoriaExistente = await Categoria.findById(id_categoria);
        if (!categoriaExistente) {
            return res.status(404).json({ msg: 'Categoría no encontrada' });
        }

        const productoActualizado = await Producto.findByIdAndUpdate(
            req.params.id,
            {
                nombre,
                descripcion,
                precio,
                imagen_url,
                stock,
                id_categoria
            },
            { new: true }
        );

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
        const productoEliminado = await Producto.findByIdAndDelete(req.params.id);
        if (!productoEliminado) {
            return res.status(404).json({ msg: 'Producto no encontrado' });
        }
        res.status(200).json({ msg: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ msg: 'Error al eliminar el producto', error: error.message });
    }
};