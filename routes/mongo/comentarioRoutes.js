const express = require('express');
const comentarioController = require('../../controllers/mongo/comentarioController');
const { verificarToken, verificarRol } = require('../../middleware/authMiddleware');
const router = express.Router();

// Crear comentario
router.post('/', 
  verificarToken, 
  comentarioController.crearComentario
);

// Dar like
router.post('/:id/like', 
  verificarToken, 
  comentarioController.darLike
);

// Reportar comentario
router.post('/:id/reportar', 
  verificarToken, 
  comentarioController.reportarComentario
);

// Obtener comentarios por servicio (pública)
router.get('/servicio/:servicioId', 
  comentarioController.obtenerComentariosPorServicio
);

module.exports = router;