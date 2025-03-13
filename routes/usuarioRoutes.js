const express = require('express');
const { 
  registrarUsuario, 
  loginUsuario,
  loginUsuarioGoogle,
  consultarUsuarios,
  eliminarUsuario,
  actualizarUsuario,
  buscarUsuarioPorId,
  buscarUsuarioPorCorreo,
  refreshToken,
  cambiarContrasena,
  registrarUsuarioAdmin
} = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas (sin autenticación)
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/login-google', loginUsuarioGoogle);
router.post('/refresh', refreshToken);

// Rutas protegidas para admin
router.post('/registro-admin', verificarToken, verificarRol(['admin']), registrarUsuarioAdmin);
router.get('/consultar', verificarToken, verificarRol(['admin']), consultarUsuarios);
router.put('/actualizar/:id', verificarToken, verificarRol(['admin']), actualizarUsuario);
router.delete('/eliminar/:id', verificarToken, verificarRol(['admin']), eliminarUsuario);

// Rutas de consulta (protegidas por token, pero accesibles para roles específicos)
router.get('/consultar/:id', verificarToken, buscarUsuarioPorId);
router.get('/buscar/:correo', verificarToken, buscarUsuarioPorCorreo);
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena);

module.exports = router;