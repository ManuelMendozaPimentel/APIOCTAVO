const express = require('express');
const comentarioController = require('../../controllers/mongo/comentarioController');
const { verificarToken } = require('../../middleware/authMiddleware'); // Importa el middleware
const router = express.Router();

// Aplica el middleware verificarToken a las rutas que requieren autenticación
router.post('/', verificarToken, comentarioController.crearComentario);
router.post('/:id/like', verificarToken, comentarioController.darLike);
router.post('/:id/reportar', verificarToken, comentarioController.reportarComentario);

// Esta ruta no requiere autenticación
router.get('/servicio/:servicioId', comentarioController.obtenerComentariosPorServicio);

module.exports = router;