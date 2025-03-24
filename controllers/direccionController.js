const Direccion = require('../models/direcciones');
const { verificarToken } = require('../middleware/authMiddleware');

exports.crearDireccion = async (req, res) => {
  try {
    const direccionData = {
      ...req.body,
      usuario_id: req.body.usuario_id || req.user.id // Si no viene en body, usa el del token
    };
    
    const direccion = await Direccion.crear(direccionData);
    res.status(201).json(direccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al crear dirección', error: error.message });
  }
};

exports.obtenerDireccionesUsuario = async (req, res) => {
  try {
    const usuario_id = req.params.usuario_id || req.user.id;
    const direcciones = await Direccion.obtenerPorUsuario(usuario_id);
    res.json(direcciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener direcciones', error: error.message });
  }
};

exports.actualizarDireccion = async (req, res) => {
  try {
    const direccion = await Direccion.actualizar(req.params.id, req.body);
    if (!direccion) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json(direccion);
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar dirección', error: error.message });
  }
};

exports.eliminarDireccion = async (req, res) => {
  try {
    const direccion = await Direccion.eliminar(req.params.id);
    if (!direccion) {
      return res.status(404).json({ message: 'Dirección no encontrada' });
    }
    res.json({ message: 'Dirección eliminada', direccion });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar dirección', error: error.message });
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
    res.status(500).json({ message: 'Error al marcar dirección como principal', error: error.message });
  }
};