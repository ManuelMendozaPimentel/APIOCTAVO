const Servicio = require('../models/servicio');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

exports.crearServicio = async (req, res) => {
  try {
    const servicioData = {
      ...req.body,
      creado_por: req.user.id // ID del usuario autenticado
    };
    
    const servicio = await Servicio.crear(servicioData);
    res.status(201).json({
      success: true,
      message: 'Servicio creado exitosamente',
      data: servicio
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio',
      error: error.message
    });
  }
};

exports.obtenerServicios = async (req, res) => {
  try {
    const activo = req.query.activo !== 'false'; // Default true
    const servicios = await Servicio.obtenerTodos(activo);
    res.json({
      success: true,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios',
      error: error.message
    });
  }
};

exports.obtenerServicioPorId = async (req, res) => {
  try {
    const servicio = await Servicio.obtenerPorId(req.params.id);
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    res.json({
      success: true,
      data: servicio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio',
      error: error.message
    });
  }
};

exports.actualizarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.actualizar(req.params.id, req.body);
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    res.json({
      success: true,
      message: 'Servicio actualizado exitosamente',
      data: servicio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio',
      error: error.message
    });
  }
};

exports.eliminarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.eliminar(req.params.id);
    if (!servicio) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }
    res.json({
      success: true,
      message: 'Servicio desactivado exitosamente',
      data: servicio
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al desactivar servicio',
      error: error.message
    });
  }
};

exports.buscarServicios = async (req, res) => {
  try {
    const servicios = await Servicio.buscarPorNombre(req.query.nombre);
    res.json({
      success: true,
      data: servicios
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar servicios',
      error: error.message
    });
  }
};