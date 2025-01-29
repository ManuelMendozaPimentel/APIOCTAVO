const { OAuth2Client } = require('google-auth-library');
const Usuario = require('../models/usuarios');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Función para verificar el token de Google
async function verifyGoogleToken(idToken) {
    try {
        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID, // Asegúrate de que coincida
        });
        return ticket.getPayload();
    } catch (error) {
        console.error('Error verificando el token de Google:', error);
        throw error;
    }
}

// Función para login de usuario con Google
exports.loginUsuarioGoogle = async (req, res) => {
    const { idToken } = req.body;

    try {
        const googleUser = await verifyGoogleToken(idToken);
        let usuario = await Usuario.findOne({ correo: googleUser.email });

        if (!usuario) {
            usuario = new Usuario({
                nombre: googleUser.given_name,
                apellidos: googleUser.family_name,
                correo: googleUser.email,
                google_token: googleUser.sub,
                contrasena: undefined, // No se requiere contraseña
            });
            await usuario.save();
        }

        const token = jwt.sign({ id: usuario._id, correo: usuario.correo }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.status(200).json({ message: 'Login exitoso con Google', token });
    } catch (error) {
        console.error('Error en loginUsuarioGoogle:', error);
        res.status(500).json({ message: 'Error al iniciar sesión con Google', error });
    }
};

// Función para registrar un usuario
exports.registrarUsuario = async (req, res) => {
    const { nombre, apellidos, correo, contrasena, google_token, direccion, telefono, veces_no_recogido, rol } = req.body;

    try {
        // Validar si el correo ya está registrado
        const usuarioExistente = await Usuario.findOne({ correo });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'El correo ya está registrado' });
        }

        // Encriptar la contraseña
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(contrasena, salt);

        // Crear el nuevo usuario
        const nuevoUsuario = new Usuario({
            nombre,
            apellidos,
            correo,
            contrasena: hashedPassword,
            google_token,
            direccion,
            telefono,
            veces_no_recogido,
            rol: rol || 'cliente', // Si no se especifica el rol, por defecto es 'cliente'
        });

        // Guardar el usuario en la base de datos
        await nuevoUsuario.save();

        // Responder con éxito
        res.status(201).json({ message: 'Usuario registrado exitosamente', usuario: nuevoUsuario });
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ message: 'Error al registrar usuario', error });
    }
};

// Función para login de un usuario
exports.loginUsuario = async (req, res) => {
    const { correo, contrasena } = req.body;

    try {
        const usuario = await Usuario.findOne({ correo });
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        const esValida = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!esValida) {
            return res.status(401).json({ message: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: usuario._id, correo: usuario.correo }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN,
        });

        res.status(200).json({ message: 'Login exitoso', token });
    } catch (error) {
        res.status(500).json({ message: 'Error al iniciar sesión', error });
    }
};

// Función para consultar todos los usuarios
exports.consultarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ message: 'Error al consultar usuarios', error });
    }
};

// Función para eliminar un usuario
exports.eliminarUsuario = async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await Usuario.findByIdAndDelete(id);

        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario', error });
    }
};

// Función para actualizar un usuario
exports.actualizarUsuario = async (req, res) => {
    const { id } = req.params;
    const { nombre, apellidos, telefono, correo, direccion } = req.body;

    try {
        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            id,
            { nombre, apellidos, telefono, correo, direccion },
            { new: true } // Devuelve el documento actualizado
        );

        if (!usuarioActualizado) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ message: 'Usuario actualizado exitosamente', usuario: usuarioActualizado });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ message: 'Error al actualizar usuario', error });
    }
};