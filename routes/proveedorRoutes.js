const express = require('express');
const {
  crearProveedor,
  obtenerProveedores,
  obtenerProveedorPorId,
  actualizarProveedor,
  eliminarProveedor,
  buscarProveedores,
  obtenerProductosPorProveedor
} = require('../controllers/proveedorController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/', obtenerProveedores);
router.get('/buscar', buscarProveedores);
router.get('/:id', obtenerProveedorPorId);
router.get('/:id/productos', obtenerProductosPorProveedor);

// Rutas protegidas
router.post('/', 
  verificarToken, 
  verificarRol(['admin', 'empleado']), 
  crearProveedor
);

router.put('/:id', 
  verificarToken, 
  verificarRol(['admin', 'empleado']), 
  actualizarProveedor
);

router.delete('/:id', 
  verificarToken, 
  verificarRol(['admin']), // Solo admin puede eliminar
  eliminarProveedor
);

module.exports = router;