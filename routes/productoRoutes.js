const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');

// Configuración de multer para guardar imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Middleware para verificar roles
const soloAdmin = verificarRol(['admin']);

// Rutas protegidas (solo admin)
router.post('/', verificarToken, soloAdmin, upload.single('imagen'), productoController.crearProducto);
router.put('/:id', verificarToken, soloAdmin, upload.single('imagen'), productoController.actualizarProducto);
router.delete('/:id', verificarToken, soloAdmin, productoController.eliminarProducto);
router.get('/:id/historial-stock', verificarToken, soloAdmin, productoController.obtenerHistorialStock);
router.get('/:id/auditoria', verificarToken, soloAdmin, productoController.obtenerAuditoriaProducto);

// Rutas para ajustes de stock (solo admin)
router.post('/:id/stock/aumentar', verificarToken, soloAdmin, productoController.aumentarStockProducto);
router.put('/:id/stock/ajustar', verificarToken, soloAdmin, productoController.ajustarStockProducto);
router.post('/:id/stock/reducir', verificarToken, soloAdmin, productoController.reducirStockProducto);

// Rutas públicas o accesibles por empleados/clientes
router.get('/', productoController.obtenerProductos);
router.get('/buscar', productoController.buscarProductosPorNombre);
router.get('/:id', productoController.obtenerProductoPorId);

module.exports = router;