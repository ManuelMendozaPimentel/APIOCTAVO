const express = require('express');
const {
  crearServicio,
  obtenerServicios,
  obtenerServicioPorId,
  actualizarServicio,
  eliminarServicio,
  buscarServicios
} = require('../controllers/servicioController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.get('/', obtenerServicios);
router.get('/buscar', buscarServicios);
router.get('/:id', obtenerServicioPorId);

// Rutas protegidas (requieren autenticación y rol adecuado)
router.post('/', 
  verificarToken, 
  verificarRol(['admin', 'empleado']), 
  crearServicio
);

router.put('/:id', 
  verificarToken, 
  verificarRol(['admin', 'empleado']), 
  actualizarServicio
);

router.delete('/:id', 
  verificarToken, 
  verificarRol(['admin']), // Solo admin puede eliminar
  eliminarServicio
);

module.exports = router;