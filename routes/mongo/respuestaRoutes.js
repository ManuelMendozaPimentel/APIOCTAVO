const express = require('express');
const respuestaController = require('../../controllers/mongo/respuestaController');
const { verificarToken } = require('../../middleware/authMiddleware'); // Importa el middleware
const router = express.Router();

// Aplica el middleware verificarToken a las rutas que requieren autenticación
router.post('/', verificarToken, respuestaController.crearRespuesta);

// Esta ruta no requiere autenticación
router.get('/comentario/:comentarioId', respuestaController.obtenerRespuestasPorComentario);

module.exports = router;