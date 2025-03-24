const express = require('express');
const { 
  crearDireccion,
  obtenerDireccionesUsuario,
  actualizarDireccion,
  eliminarDireccion,
  marcarDireccionPrincipal
} = require('../controllers/direccionController');
const { verificarToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verificarToken);

router.post('/', crearDireccion);
router.get('/usuario/:usuario_id?', obtenerDireccionesUsuario);
router.put('/:id', actualizarDireccion);
router.delete('/:id', eliminarDireccion);
router.patch('/:id/principal', marcarDireccionPrincipal);

module.exports = router;