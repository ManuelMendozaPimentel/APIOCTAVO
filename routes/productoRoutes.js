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

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Límite de 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes (jpeg, jpg, png, gif)'));
  }
});

// Middleware para verificar roles (admin)
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
router.get('/sku/:sku', productoController.obtenerProductoPorSku);

router.post('/:producto_id/proveedores', verificarToken, soloAdmin, productoController.agregarProveedor);
router.delete('/:producto_id/proveedores/:proveedor_id', verificarToken, soloAdmin, productoController.eliminarProveedor);
router.get('/:producto_id/proveedores', verificarToken, productoController.obtenerProveedores);
router.put('/:producto_id/proveedores/:proveedor_id', verificarToken, soloAdmin, productoController.actualizarProveedorProducto);


// Manejo de errores de multer
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ msg: err.message });
  } else if (err) {
    return res.status(400).json({ msg: err.message });
  }
  next();
});

module.exports = router;