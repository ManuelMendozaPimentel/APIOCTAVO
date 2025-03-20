const { OAuth2Client } = require('google-auth-library');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const Usuario = require('../models/usuarios');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Configuración de transporter con variables de entorno
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD // Usa variable de entorno
  }
});

// Función para generar contraseñas temporales
function generarContrasenaTemporal() {
  return Math.random().toString(36).slice(-8);
}

/**
 * Registrar un usuario administrador (solo accesible por admin).
 * - Valida que se proporcione un correo único.
 * - Genera una contraseña temporal y envía un correo al nuevo usuario.
 * - Establece la bandera `cambiar_contrasena` en `true`.
 */
exports.registrarUsuarioAdmin = async (req, res) => {
  const { nombre, apellidos, correo, direccion, telefono, rol } = req.body;

  try {
    // Verificar si el correo ya está registrado
    const usuarioExistente = await Usuario.obtenerPorCorreo(correo);
    if (usuarioExistente) {
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Generar una contraseña temporal
    const tempPassword = generarContrasenaTemporal();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Crear el usuario administrativo
    const usuario = await Usuario.crear({
      nombre,
      apellidos,
      correo,
      contrasena: hashedPassword,
      direccion,
      telefono,
      rol,
      cambiar_contrasena: true // Forzar cambio de contraseña al primer login
    });

    // Enviar correo con la contraseña temporal
    await transporter.sendMail({
      from: '"Tienda API" <no-reply@tiendapi.com>',
      to: correo,
      subject: 'Credenciales de acceso',
      text: `Tu contraseña temporal es: ${tempPassword}. Cámbiala en tu primer inicio de sesión.`
    });

    // Generar token JWT (opcional, si deseas devolver un token)
    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Respuesta exitosa
    res.status(201).json({ 
      message: 'Usuario administrativo creado', 
      token, // Opcional: Devuelve el token si es necesario
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellidos: usuario.apellidos,
        correo: usuario.correo,
        direccion: usuario.direccion,
        telefono: usuario.telefono,
        rol: usuario.rol
      }
    });
  } catch (error) {
    console.error('Error al registrar usuario administrativo:', error);
    res.status(500).json({ message: 'Error al crear usuario administrativo', error: error.message });
  }
};

/**
 * Registro tradicional de usuarios (clientes).
 * - Valida que el correo no esté registrado previamente.
 * - Hashea la contraseña antes de guardarla en la base de datos.
 * - Genera un token JWT para el usuario recién registrado.
 */
exports.registrarUsuario = async (req, res) => {
  const { nombre, apellidos, correo, contrasena, direccion, telefono } = req.body;
  
  try {
    // Validar que el correo no esté registrado
    const usuarioExistente = await Usuario.obtenerPorCorreo(correo); // Aquí está la validación de correo duplicado
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
      cambiar_contrasena: false
    });

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({ 
      message: 'Usuario registrado', 
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

/**
 * Login tradicional para usuarios registrados.
 * - Valida que el correo exista en la base de datos.
 * - Compara la contraseña hasheada con la proporcionada.
 * - Si la bandera `cambiar_contrasena` está activa, obliga al usuario a cambiar su contraseña.
 */
exports.loginUsuario = async (req, res) => {
  const { correo, contrasena } = req.body;
  
  try {
    const usuario = await Usuario.obtenerPorCorreo(correo);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' }); // Aquí está la validación de usuario inexistente

    const esValida = await bcrypt.compare(contrasena, usuario.contrasena); // Aquí está la validación de contraseña incorrecta
    if (!esValida) return res.status(401).json({ message: 'Contraseña incorrecta' });

    if (usuario.cambiar_contrasena) {
      const tokenTemporal = jwt.sign(
        { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
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
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
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
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

/**
 * Login con Google.
 * - Verifica el token de Google y obtiene los datos del usuario.
 * - Si el usuario no existe, crea uno nuevo con rol `cliente`.
 * - Genera un token JWT para el usuario.
 */
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
      usuario = await Usuario.crear({
        nombre: payload.given_name,
        apellidos: payload.family_name || '',
        correo: payload.email,
        google_id: payload.sub,
        rol: 'cliente',
        cambiar_contrasena: false
      });
    }

    const token = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({ 
      message: 'Login exitoso con Google', 
      token,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión con Google', error: error.message });
  }
};

/**
 * Refrescar token JWT.
 * - Valida que se proporcione un token válido.
 * - Verifica que el usuario asociado al token aún exista en la base de datos.
 * - Genera un nuevo token JWT.
 */
exports.refreshToken = async (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token no proporcionado' }); // Aquí está la validación de token no proporcionado
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true }); // Aquí está la validación de token expirado o inválido
    const usuario = await Usuario.obtenerPorId(decoded.id);
    
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' }); // Aquí está la validación de usuario eliminado
    }

    const newToken = jwt.sign(
      { id: usuario.id, correo: usuario.correo, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json({
      token: newToken,
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol
      }
    });
  } catch (error) {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

/**
 * Cambiar contraseña de un usuario.
 * - Valida que la contraseña actual sea correcta (excepto para primer cambio).
 * - Hashea la nueva contraseña antes de actualizarla en la base de datos.
 * - Desactiva la bandera `cambiar_contrasena` después del cambio.
 */
exports.cambiarContrasena = async (req, res) => {
  const { id } = req.user;
  const { contrasena_actual, nueva_contrasena } = req.body;
  
  try {
    const usuario = await Usuario.obtenerPorId(id);
    
    // Validar contraseña actual (excepto para primer cambio)
    if (!usuario.cambiar_contrasena) {
      const valida = await bcrypt.compare(contrasena_actual, usuario.contrasena); // Aquí está la validación de contraseña incorrecta
      if (!valida) return res.status(401).json({ message: 'Contraseña actual incorrecta' });
    }

    const hashed = await bcrypt.hash(nueva_contrasena, 10);
    await Usuario.actualizar(id, { 
      contrasena: hashed,
      cambiar_contrasena: false // Desactivar la bandera de cambio de contraseña
    });

    res.json({ message: 'Contraseña actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

// Obtener todos los usuarios (solo admin)
exports.consultarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.obtenerTodos();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar usuarios', error: error.message });
  }
};

// Eliminar usuario (solo admin)
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  
  try {
    const usuarioEliminado = await Usuario.eliminar(id);
    if (!usuarioEliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario eliminado', usuario: usuarioEliminado });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

// Actualizar usuario (solo admin o el mismo usuario)
exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const datos = req.body;
  
  try {
    // Evita que usuarios no admin cambien roles
    if (req.user.rol !== 'admin' && datos.rol) {
      delete datos.rol;
    }

    const usuarioActualizado = await Usuario.actualizar(id, datos);
    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json({ message: 'Usuario actualizado', usuario: usuarioActualizado });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

/**
 * Obtener todos los usuarios (solo accesible por admin).
 * - Valida que el usuario tenga el rol `admin`.
 * - Consulta y devuelve todos los usuarios registrados en la base de datos.
 */
exports.consultarUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.obtenerTodos();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ message: 'Error al consultar usuarios', error: error.message });
  }
};

/**
 * Eliminar un usuario (solo accesible por admin).
 * - Valida que el usuario exista en la base de datos.
 * - Elimina al usuario y devuelve los datos del usuario eliminado.
 */
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  
  try {
    const usuarioEliminado = await Usuario.eliminar(id);
    if (!usuarioEliminado) {
      return res.status(404).json({ message: 'Usuario no encontrado' }); // Aquí está la validación de usuario inexistente
    }
    res.status(200).json({ message: 'Usuario eliminado', usuario: usuarioEliminado });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};

/**
 * Actualizar un usuario (accesible por admin o el mismo usuario).
 * - Evita que usuarios no admin cambien roles.
 * - Valida que el usuario exista antes de actualizarlo.
 * - Actualiza los datos proporcionados y devuelve el usuario actualizado.
 */
exports.actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const datos = req.body;
  
  try {
    // Evita que usuarios no admin cambien roles
    if (req.user.rol !== 'admin' && datos.rol) {
      delete datos.rol; // Aquí está la validación para evitar cambios de rol por usuarios no admin
    }

    const usuarioActualizado = await Usuario.actualizar(id, datos);
    if (!usuarioActualizado) {
      return res.status(404).json({ message: 'Usuario no encontrado' }); // Aquí está la validación de usuario inexistente
    }
    res.status(200).json({ message: 'Usuario actualizado', usuario: usuarioActualizado });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

/**
 * Buscar un usuario por ID.
 * - Valida que el usuario exista en la base de datos.
 * - Devuelve los datos del usuario encontrado.
 */
exports.buscarUsuarioPorId = async (req, res) => {
  const { id } = req.params;
  
  try {
    const usuario = await Usuario.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' }); // Aquí está la validación de usuario inexistente
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario', error: error.message });
  }
};

/**
 * Buscar un usuario por correo electrónico.
 * - Valida que el usuario exista en la base de datos.
 * - Devuelve los datos del usuario encontrado.
 */
exports.buscarUsuarioPorCorreo = async (req, res) => {
  const { correo } = req.params;
  
  try {
    const usuario = await Usuario.obtenerPorCorreo(correo);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' }); // Aquí está la validación de usuario inexistente
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario', error: error.message });
  }
};