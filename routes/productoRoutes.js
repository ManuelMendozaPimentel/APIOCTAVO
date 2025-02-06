const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const multer = require('multer');
const path = require('path');

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Guarda las imágenes en la carpeta "uploads"
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // Nombre único para la imagen
  }
});

const upload = multer({ storage: storage });

// Rutas para productos
router.post('/', upload.single('imagen'), productoController.crearProducto); // Subir imagen al crear
router.put('/:id', upload.single('imagen'), productoController.actualizarProducto); // Subir imagen al actualizar
router.get('/', productoController.obtenerProductos);
router.get('/:id', productoController.obtenerProductoPorId);
router.get('/buscar', productoController.buscarProductosPorNombre);
router.delete('/:id', productoController.eliminarProducto);

module.exports = router;