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
  registrarUsuarioAdmin,
  agregarDireccion,
  obtenerDirecciones,
  marcarDireccionPrincipal
} = require('../controllers/usuarioController');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas
router.post('/registro', registrarUsuario);
router.post('/login', loginUsuario);
router.post('/login-google', loginUsuarioGoogle);
router.post('/refresh', refreshToken);

// Rutas protegidas (admin)
router.post('/registro-admin', verificarToken, verificarRol(['admin']), registrarUsuarioAdmin);
router.get('/consultar', verificarToken, verificarRol(['admin']), consultarUsuarios);
router.put('/actualizar/:id', verificarToken, verificarRol(['admin']), actualizarUsuario);
router.delete('/eliminar/:id', verificarToken, verificarRol(['admin']), eliminarUsuario);

// Rutas protegidas (generales)
router.get('/consultar/:id', verificarToken, buscarUsuarioPorId);
router.get('/buscar/:correo', verificarToken, buscarUsuarioPorCorreo);
router.post('/cambiar-contrasena', verificarToken, cambiarContrasena);

// Rutas para direcciones
router.post('/direcciones', verificarToken, agregarDireccion);
router.get('/direcciones', verificarToken, obtenerDirecciones);
router.patch('/direcciones/:id/principal', verificarToken, marcarDireccionPrincipal);

module.exports = router;