const Proveedor = require('../models/proveedores');
const { verificarToken, verificarRol } = require('../middleware/authMiddleware');

exports.crearProveedor = async (req, res) => {
  try {
    const proveedorData = {
      ...req.body,
      creado_por: req.user.id // ID del usuario autenticado
    };
    
    // Validación básica
    if (!proveedorData.nombre) {
      return res.status(400).json({
        success: false,
        message: 'El nombre del proveedor es requerido'
      });
    }

    const proveedor = await Proveedor.crear(proveedorData);
    
    res.status(201).json({
      success: true,
      message: 'Proveedor creado exitosamente',
      data: proveedor
    });
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear proveedor',
      error: error.message
    });
  }
};

exports.obtenerProveedores = async (req, res) => {
  try {
    const activo = req.query.activo !== 'false'; // Default true
    const proveedores = await Proveedor.obtenerTodos(activo);
    
    res.json({
      success: true,
      count: proveedores.length,
      data: proveedores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedores',
      error: error.message
    });
  }
};

exports.obtenerProveedorPorId = async (req, res) => {
  try {
    const proveedor = await Proveedor.obtenerPorId(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: proveedor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener proveedor',
      error: error.message
    });
  }
};

exports.actualizarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.actualizar(req.params.id, req.body);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Proveedor actualizado exitosamente',
      data: proveedor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar proveedor',
      error: error.message
    });
  }
};

exports.eliminarProveedor = async (req, res) => {
  try {
    const proveedor = await Proveedor.eliminar(req.params.id);
    
    if (!proveedor) {
      return res.status(404).json({
        success: false,
        message: 'Proveedor no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Proveedor desactivado exitosamente',
      data: proveedor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al desactivar proveedor',
      error: error.message
    });
  }
};

exports.buscarProveedores = async (req, res) => {
  try {
    if (!req.query.nombre) {
      return res.status(400).json({
        success: false,
        message: 'Parámetro de búsqueda (nombre) es requerido'
      });
    }
    
    const proveedores = await Proveedor.buscarPorNombre(req.query.nombre);
    
    res.json({
      success: true,
      count: proveedores.length,
      data: proveedores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al buscar proveedores',
      error: error.message
    });
  }
};

exports.obtenerProductosPorProveedor = async (req, res) => {
  try {
    const productos = await Proveedor.obtenerProductos(req.params.id);
    
    res.json({
      success: true,
      count: productos.length,
      data: productos
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos del proveedor',
      error: error.message
    });
  }
};