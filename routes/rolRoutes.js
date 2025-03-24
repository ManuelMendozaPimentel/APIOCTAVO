const express = require('express');
const { 
  crearRol,
  obtenerRoles,
  obtenerRolPorId,
  actualizarRol,
  eliminarRol
} = require('../controllers/rolController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Solo administradores pueden gestionar roles
router.use(verificarToken, verificarRol(['admin']));

router.post('/', crearRol);
router.get('/', obtenerRoles);
router.get('/:id', obtenerRolPorId);
router.put('/:id', actualizarRol);
router.delete('/:id', eliminarRol);

module.exports = router;