const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

router.post('/', ventaController.crearVenta);
router.get('/', ventaController.obtenerVentas);
router.get('/:id', ventaController.obtenerVentaPorId);
router.put('/:id/estatus', ventaController.actualizarEstatusVenta);
router.delete('/:id', ventaController.eliminarVenta);

module.exports = router;