const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// Ruta para crear una nueva venta
router.post('/ventas', ventaController.crearVenta);

// Otras rutas (opcional)
router.get('/ventas', ventaController.obtenerVentas);
router.get('/ventas/:id', ventaController.obtenerVentaPorId);
router.put('/ventas/:id/estatus', ventaController.actualizarEstatusVenta);
router.delete('/ventas/:id', ventaController.eliminarVenta);

module.exports = router;        