const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuarios');
const Rol = require('../models/roles');
const Direccion = require('../models/direcciones');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

function generarContrasenaTemporal() {
  return Math.random().toString(36).slice(-8);
}

// Registro de administrador
exports.registrarUsuarioAdmin = async (req, res) => {
  const { nombre, apellidos, correo, telefono, rol_id } = req.body;
  
  try {
    // Verificar rol
    const rol = await Rol.obtenerPorId(rol_id);
    if (!rol) {
      return res.status(400).json({ message: 'Rol no válido' });
    }

    // Verificar correo
    const usuarioExistente = await Usuario.obtenerPorCorreo(correo);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Crear usuario
    const tempPassword = generarContrasenaTemporal();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const usuario = await Usuario.crear({
      nombre,
      apellidos,
      correo,
      contrasena: hashedPassword,
      telefono,
      rol_id,
      cambiar_contrasena: true
    });

    // Enviar correo (opcional)
    await transporter.sendMail({
      from: `"${process.env.APP_NAME}" <${process.env.EMAIL_USER}>`,
      to: correo,
      subject: 'Credenciales de acceso',
      text: `Tu contraseña temporal es: ${tempPassword}`
    });

    // Respuesta
    const token = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo, 
        rol_id: usuario.rol_id,
        rol_nombre: rol.nombre 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ 
      message: 'Usuario administrativo creado', 
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        telefono: usuario.telefono,
        rol_id: usuario.rol_id,
        rol_nombre: rol.nombre
      }
    });
  } catch (error) {
    console.error('Error al registrar admin:', error);
    res.status(500).json({ message: 'Error al crear usuario administrativo', error: error.message });
  }
};

// Registro de cliente
exports.registrarUsuario = async (req, res) => {
  const { nombre, apellidos, correo, contrasena, telefono } = req.body;
  
  try {
    // Obtener ID del rol cliente (asumimos que es 3)
    const rolCliente = await Rol.obtenerPorId(3);
    if (!rolCliente) {
      return res.status(500).json({ message: 'Configuración de roles incorrecta' });
    }

    // Verificar correo
    const usuarioExistente = await Usuario.obtenerPorCorreo(correo);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Crear usuario
    const hashedPassword = await bcrypt.hash(contrasena, 10);
    const usuario = await Usuario.crear({
      nombre,
      apellidos,
      correo,
      contrasena: hashedPassword,
      telefono,
      rol_id: rolCliente.id,
      cambiar_contrasena: false
    });

    // Respuesta
    const token = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo, 
        rol_id: usuario.rol_id,
        rol_nombre: rolCliente.nombre 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ 
      message: 'Usuario registrado exitosamente',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        rol_nombre: rolCliente.nombre
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
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
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    if (usuario.cambiar_contrasena) {
      const tokenTemporal = jwt.sign(
        { 
          id: usuario.id, 
          correo: usuario.correo, 
          rol_id: usuario.rol_id,
          rol_nombre: usuario.rol_nombre 
        },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );
      return res.status(403).json({
        message: 'Debe cambiar su contraseña',
        cambiar_contrasena: true,
        token: tokenTemporal
      });
    }

    const token = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo, 
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// Login con Google
exports.loginUsuarioGoogle = async (req, res) => {
  const { idToken } = req.body;
  
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    let usuario = await Usuario.obtenerPorCorreo(payload.email);
    if (!usuario) {
      // Obtener ID del rol cliente (asumimos que es 3)
      const rolCliente = await Rol.obtenerPorId(3);
      if (!rolCliente) {
        return res.status(500).json({ message: 'Configuración de roles incorrecta' });
      }

      usuario = await Usuario.crear({
        nombre: payload.given_name,
        apellidos: payload.family_name || '',
        correo: payload.email,
        google_id: payload.sub,
        rol_id: rolCliente.id,
        cambiar_contrasena: false
      });
    }

    const token = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo, 
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({ 
      message: 'Login exitoso', 
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al autenticar con Google', error: error.message });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    const usuario = await Usuario.obtenerPorId(decoded.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const newToken = jwt.sign(
      { 
        id: usuario.id, 
        correo: usuario.correo, 
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: newToken,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol_id: usuario.rol_id,
        rol_nombre: usuario.rol_nombre
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};

// Cambiar contraseña
exports.cambiarContrasena = async (req, res) => {
  const { id } = req.user;
  const { contrasena_actual, nueva_contrasena } = req.body;
  
  try {
    const usuario = await Usuario.obtenerPorId(id);
    
    if (!usuario.cambiar_contrasena) {
      const valida = await bcrypt.compare(contrasena_actual, usuario.contrasena);
      if (!valida) {
        return res.status(401).json({ message: 'Contraseña actual incorrecta' });
      }
    }

    const hashed = await bcrypt.hash(nueva_contrasena, 10);
    await Usuario.actualizar(id, { 
      contrasena: hashed,
      cambiar_contrasena: false
    });

    res.json({ message: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña', error: error.message });
  }
};

// Obtener todos los usuarios (admin)
exports.consultarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.obtenerTodos();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios', error: error.message });
  }
};

// Eliminar usuario (admin)
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await Usuario.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    if (usuario.rol_nombre === 'cliente') {
      return res.status(400).json({ message: 'No se puede desactivar clientes' });
    }

    const usuarioDesactivado = await Usuario.eliminar(id);
    res.status(200).json({ 
      message: 'Usuario desactivado', 
      usuario: usuarioDesactivado 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar usuario', error: error.message });
  }
};

// Actualizar usuario
exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const datos = req.body;
  
  try {
    // Solo admin puede cambiar roles
    if (req.user.rol_id !== 1 && datos.rol_id) { // Asumiendo que admin tiene id=1
      delete datos.rol_id;
    }

    const usuarioActualizado = await Usuario.actualizar(id, datos);
    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json({ 
      message: 'Usuario actualizado', 
      usuario: usuarioActualizado 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Obtener usuario por ID
exports.buscarUsuarioPorId = async (req, res) => {
  const { id } = req.params;
  
  try {
    const usuario = await Usuario.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario', error: error.message });
  }
};

// Obtener usuario por correo
exports.buscarUsuarioPorCorreo = async (req, res) => {
  const { correo } = req.params;
  
  try {
    const usuario = await Usuario.obtenerPorCorreo(correo);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario', error: error.message });
  }
};

// Direcciones del usuario
exports.agregarDireccion = async (req, res) => {
  try {
    const direccionData = {
      ...req.body,
      usuario_id: req.user.id
    };
    const direccion = await Direccion.crear(direccionData);
    res.status(201).json(direccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar dirección', error: error.message });
  }
};

exports.obtenerDirecciones = async (req, res) => {
  try {
    const direcciones = await Usuario.obtenerDirecciones(req.user.id);
    res.json(direcciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener direcciones', error: error.message });
  }
};

exports.marcarDireccionPrincipal = async (req, res) => {
  try {
    const direccion = await Direccion.marcarComoPrincipal(
      req.params.id,
      req.user.id
    );
    if (!direccion) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json(direccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al marcar dirección', error: error.message });
  }
};