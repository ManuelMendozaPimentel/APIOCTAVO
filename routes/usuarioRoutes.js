const express = require('express');
const { registrarUsuario, loginUsuario,consultarUsuarios,eliminarUsuario,loginUsuarioGoogle,actualizarUsuario, buscarUsuarioPorId,buscarUsuarioPorCorreo, refreshToken } = require('../controllers/usuarioController');

const router = express.Router();

// Ruta para registrar usuario
router.post('/registro', registrarUsuario);

// Ruta para login
router.post('/login', loginUsuario);

router.post('/login-google', loginUsuarioGoogle);

// Ruta para consultar usuarios
router.get('/consultar', consultarUsuarios);

// Ruta para eliminar usuario
router.delete('/eliminar/:id', eliminarUsuario);

router.put('/actualizar/:id', actualizarUsuario);

router.get('/consultar/:id', buscarUsuarioPorId);

// Ruta para buscar usuario por correo
router.get('/buscar/:correo', buscarUsuarioPorCorreo);
router.post('/refresh', refreshToken);

module.exports = router;
