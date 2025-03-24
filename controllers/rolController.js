const Rol = require('../models/roles');

exports.crearRol = async (req, res) => {
  try {
    const rol = await Rol.crear(req.body);
    res.status(201).json(rol);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear rol', error: error.message });
  }
};

exports.obtenerRoles = async (req, res) => {
  try {
    const roles = await Rol.obtenerTodos();
    res.json(roles);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener roles', error: error.message });
  }
};

exports.obtenerRolPorId = async (req, res) => {
  try {
    const rol = await Rol.obtenerPorId(req.params.id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    res.json(rol);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener rol', error: error.message });
  }
};

exports.actualizarRol = async (req, res) => {
  try {
    const rol = await Rol.actualizar(req.params.id, req.body);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    res.json(rol);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar rol', error: error.message });
  }
};

exports.eliminarRol = async (req, res) => {
  try {
    const rol = await Rol.eliminar(req.params.id);
    if (!rol) {
      return res.status(404).json({ message: 'Rol no encontrado' });
    }
    res.json({ message: 'Rol desactivado', rol });
  } catch (error) {
    res.status(500).json({ message: 'Error al desactivar rol', error: error.message });
  }
};