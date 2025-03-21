const express = require('express');
const servicioController = require('../../controllers/mongo/servicioController');
const router = express.Router();

router.post('/', servicioController.crearServicio);
router.get('/', servicioController.obtenerServicios);
router.get('/:slug', servicioController.obtenerServicioPorSlug);
router.put('/:id', servicioController.actualizarServicio);
router.delete('/:id', servicioController.eliminarServicio);

module.exports = router;