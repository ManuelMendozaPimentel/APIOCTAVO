// controllers/usuarioController.js

const { OAuth2Client } = require('google-auth-library');
const Usuario = require('../models/usuarios'); // Asegúrate de que la ruta es correcta y el nombre del archivo es 'usuario.js'
const pool = require('../config/db'); // Importa el pool de conexiones
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Función para verificar el token de Google
async function verifyGoogleToken(idToken) {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
  } catch (error) {
    console.error('Error verificando el token de Google:', error);
    throw error;
  }
}

// Login con Google
exports.loginUsuarioGoogle = async (req, res) => {
  const { idToken } = req.body;

  try {
    const googleUser = await verifyGoogleToken(idToken);
    let usuario = await Usuario.obtenerPorCorreo(googleUser.email);

    if (!usuario) {
      usuario = await Usuario.crear({
        nombre: googleUser.given_name,
        apellidos: googleUser.family_name || '',
        correo: googleUser.email,
        google_id: googleUser.sub,
        rol: 'cliente',
      });
    }

    const token = jwt.sign({ id: usuario.id, correo: usuario.correo }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.status(200).json({ message: 'Login exitoso con Google', token });
  } catch (error) {
    console.error('Error en loginUsuarioGoogle:', error);
    res.status(500).json({ message: 'Error al iniciar sesión con Google', error });
  }
};

// Registro tradicional
exports.registrarUsuario = async (req, res) => {
  const { nombre, apellidos, correo, contrasena, direccion, telefono } = req.body;

  try {
    const usuarioExistente = await Usuario.obtenerPorCorreo(correo);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const usuario = await Usuario.crear({
      nombre,
      apellidos,
      correo,
      contrasena: hashedPassword,
      direccion,
      telefono,
      rol: 'cliente',
    });

    res.status(201).json({ message: 'Usuario registrado', usuario });
  } catch (error) {
    console.error('Error en registrarUsuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error });
  }
};

// Login tradicional
exports.loginUsuario = async (req, res) => {
  const { correo, contrasena } = req.body;

  try {
    const usuario = await Usuario.obtenerPorCorreo(correo);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!esValida) {
      return res.status(401).json({ message: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo,
        tipo: usuario.tipo // Asegúrate de incluir el tipo de usuario
      }, 
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Respuesta modificada para incluir datos del usuario
    res.json({
      success: true,
      token: token,
      user: {
        id: usuario.id,
        correo: usuario.correo,
        tipo: usuario.tipo,
        nombre: usuario.nombre // Incluir otros datos necesarios
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Obtener todos los usuarios
exports.consultarUsuarios = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error en consultarUsuarios:', error);
    res.status(500).json({ message: 'Error al consultar usuarios', error });
  }
};

// Eliminar usuario
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.eliminar(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado', usuario });
  } catch (error) {
    console.error('Error en eliminarUsuario:', error);
    res.status(500).json({ message: 'Error al eliminar usuario', error });
  }
};

// Actualizar usuario
exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const datos = req.body;

  try {
    const usuarioActualizado = await Usuario.actualizar(id, datos);
    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario actualizado', usuario: usuarioActualizado });
  } catch (error) {
    console.error('Error en actualizarUsuario:', error);
    res.status(500).json({ message: 'Error al actualizar usuario', error });
  }
};

exports.buscarUsuarioPorId = async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error en buscarUsuarioPorId:', error);
    res.status(500).json({ message: 'Error al buscar usuario', error });
  }
};

// Buscar usuario por correo
exports.buscarUsuarioPorCorreo = async (req, res) => {
  const { correo } = req.params;

  try {
    const usuario = await Usuario.obtenerPorCorreo(correo);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    console.error('Error en buscarUsuarioPorCorreo:', error);
    res.status(500).json({ message: 'Error al buscar usuario', error });
  }
}

// Añade esto al final de usuarioController.js
exports.refreshToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];

  try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      
      // Verificar si el usuario aún existe
      const usuario = await Usuario.obtenerPorId(decoded.id);
      if (!usuario) {
          return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      // Generar nuevo token
      const newToken = jwt.sign(
          { 
              id: usuario.id, 
              correo: usuario.correo,
              tipo: usuario.tipo
          }, 
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json({
          token: newToken,
          user: {
              id: usuario.id,
              correo: usuario.correo,
              tipo: usuario.tipo,
              nombre: usuario.nombre
          }
      });
  } catch (error) {
      console.error('Error en refreshToken:', error);
      res.status(401).json({ message: 'Token inválido o expirado' });
  }
};