const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

// Rutas para categorías
router.get('/inactivas', verificarToken, verificarRol(['admin']), categoriaController.obtenerCategoriasInactivas);
router.put('/:id/activar', verificarToken, verificarRol(['admin']), categoriaController.activarCategoria);
router.post('/', verificarToken, verificarRol(['admin']), categoriaController.crearCategoria); // Crear categoría (solo admin)
router.get('/', verificarToken, categoriaController.obtenerCategorias); // Obtener todas las categorías (cualquier usuario autenticado)
router.get('/:id', verificarToken, categoriaController.obtenerCategoriaPorId); // Obtener categoría por ID (cualquier usuario autenticado)
router.put('/:id', verificarToken, verificarRol(['admin']), categoriaController.actualizarCategoria); // Actualizar categoría (solo admin)
router.delete('/:id', verificarToken, verificarRol(['admin']), categoriaController.eliminarCategoria); // Eliminar categoría (solo admin)

module.exports = router;