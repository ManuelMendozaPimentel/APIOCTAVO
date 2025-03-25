const Producto = require('../models/producto');
const Categoria = require('../models/categoria');

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, categoria_id, sku, stock } = req.body;
    const imagen_url = req.file ? req.file.filename : req.body.imagen_url;

    // Validar SKU único
    const skuExistente = await Producto.obtenerProductoPorSku(sku);
    if (skuExistente) {
      return res.status(400).json({ msg: 'El SKU ya está registrado' });
    }

    // Verificar si la categoría existe
    if (categoria_id) {
      const categoriaExistente = await Categoria.obtenerPorId(categoria_id);
      if (!categoriaExistente) {
        return res.status(404).json({ msg: 'Categoría no encontrada' });
      }
    }

    const nuevoProducto = await Producto.crearProducto({
      nombre,
      descripcion,
      precio,
      categoria_id: categoria_id || null,
      imagen_url,
      stock,
      sku,
      creado_por: req.user.id
    });

    // Registrar en auditoría
    await Producto.registrarAuditoriaProducto(
      nuevoProducto.id,
      req.user.id,
      'crear',
      { detalles: 'Creación de nuevo producto' }
    );

    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear el producto', error: error.message });
  }
};

// Obtener lista de productos
exports.obtenerProductos = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoria_id, min_precio, max_precio, disponible } = req.query;

    const productos = await Producto.obtenerProductos({
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      categoria_id,
      min_precio: min_precio ? parseFloat(min_precio) : undefined,
      max_precio: max_precio ? parseFloat(max_precio) : undefined,
      disponible: disponible === 'true'
    });

    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener los productos', error: error.message });
  }
};

// Obtener un producto por ID
exports.obtenerProductoPorId = async (req, res) => {
  try {
    const producto = await Producto.obtenerProductoPorId(req.params.id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }
    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener el producto', error: error.message });
  }
};

// Buscar productos por nombre
exports.buscarProductosPorNombre = async (req, res) => {
  try {
    const { nombre } = req.query;
    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return res.status(400).json({ msg: 'El nombre es obligatorio y debe ser una cadena de texto válida' });
    }

    const productos = await Producto.buscarProductosPorNombre(nombre.trim());
    if (productos.length === 0) {
      return res.status(404).json({ msg: 'No se encontraron productos con ese nombre' });
    }

    res.status(200).json(productos);
  } catch (error) {
    res.status(500).json({ msg: 'Error al buscar productos', error: error.message });
  }
};

// Actualizar un producto
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Campos permitidos para actualización
    const camposPermitidos = ['nombre', 'descripcion', 'precio', 'stock', 'imagen_url', 'categoria_id'];
    const datosFiltrados = Object.keys(datosActualizacion)
      .filter(key => camposPermitidos.includes(key))
      .reduce((obj, key) => {
        obj[key] = datosActualizacion[key];
        return obj;
      }, {});

    if (Object.keys(datosFiltrados).length === 0) {
      return res.status(400).json({ msg: 'Debes proporcionar al menos un campo válido para actualizar' });
    }

    // Obtener el producto antes de actualizarlo
    const productoAnterior = await Producto.obtenerProductoPorId(id);
    if (!productoAnterior) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Agregar usuario que modifica
    datosFiltrados.modificado_por = req.user.id;

    // Actualizar el producto
    const productoActualizado = await Producto.actualizarProducto(id, datosFiltrados);

    // Registrar en auditoría
    await Producto.registrarAuditoriaProducto(
      id,
      req.user.id,
      'actualizar',
      { anterior: productoAnterior, nuevo: productoActualizado }
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al actualizar el producto', error: error.message });
  }
};

// Aumentar stock de un producto
exports.aumentarStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null || cantidad <= 0) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio y debe ser un número positivo' });
    }

    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    const productoActualizado = await Producto.aumentarStock(id, cantidad, req.user.id);

    await Producto.registrarHistorialStock(
      id,
      req.user.id,
      producto.stock,
      productoActualizado.stock,
      'Aumento de stock'
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al aumentar el stock', error: error.message });
  }
};

// Ajustar stock de un producto
exports.ajustarStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null || cantidad < 0) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio y debe ser un número no negativo' });
    }

    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    const productoActualizado = await Producto.ajustarStock(id, cantidad, req.user.id);

    await Producto.registrarHistorialStock(
      id,
      req.user.id,
      producto.stock,
      productoActualizado.stock,
      'Ajuste de stock'
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al ajustar el stock', error: error.message });
  }
};

// Reducir stock de un producto
exports.reducirStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null || cantidad <= 0) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio y debe ser un número positivo' });
    }

    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    if (producto.stock < cantidad) {
      return res.status(400).json({ msg: 'No hay suficiente stock para reducir' });
    }

    const productoActualizado = await Producto.reducirStock(id, cantidad, req.user.id);

    await Producto.registrarHistorialStock(
      id,
      req.user.id,
      producto.stock,
      productoActualizado.stock,
      'Reducción de stock'
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al reducir el stock', error: error.message });
  }
};

// Obtener historial de stock de un producto
exports.obtenerHistorialStock = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await Producto.obtenerHistorialStock(id);
    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener el historial de stock', error: error.message });
  }
};

// Obtener auditoría de un producto
exports.obtenerAuditoriaProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const auditoria = await Producto.obtenerAuditoriaProducto(id);
    res.status(200).json(auditoria);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener la auditoría del producto', error: error.message });
  }
};

// Eliminar (marcar como inactivo) un producto
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    const productoEliminado = await Producto.eliminarProducto(id, req.user.id);

    await Producto.registrarAuditoriaProducto(
      id,
      req.user.id,
      'eliminar_logico',
      { detalles: 'Producto marcado como inactivo' }
    );

    res.status(200).json({ msg: 'Producto marcado como inactivo', producto: productoEliminado });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar el producto', error: error.message });
  }
};

// Obtener producto por SKU
exports.obtenerProductoPorSku = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      return res.status(400).json({ msg: 'El SKU es obligatorio y debe ser una cadena de texto válida' });
    }

    const producto = await Producto.obtenerProductoPorSku(sku.trim());

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener el producto por SKU', error: error.message });
  }
};

// Agregar proveedor a un producto
exports.agregarProveedor = async (req, res) => {
  try {
    const { producto_id } = req.params;
    const { proveedor_id, precio_compra, codigo_proveedor } = req.body;

    // Validaciones
    if (!proveedor_id || !precio_compra) {
      return res.status(400).json({ 
        success: false,
        msg: 'proveedor_id y precio_compra son requeridos' 
      });
    }

    const relacion = await Producto.agregarProveedor(
      producto_id,
      proveedor_id,
      precio_compra,
      codigo_proveedor
    );

    res.status(201).json({
      success: true,
      msg: 'Proveedor agregado al producto',
      data: relacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al agregar proveedor al producto',
      error: error.message
    });
  }
};

// Eliminar proveedor de un producto
exports.eliminarProveedor = async (req, res) => {
  try {
    const { producto_id, proveedor_id } = req.params;

    const resultado = await Producto.eliminarProveedor(producto_id, proveedor_id);

    if (!resultado) {
      return res.status(404).json({
        success: false,
        msg: 'Relación no encontrada'
      });
    }

    res.json({
      success: true,
      msg: 'Proveedor eliminado del producto',
      data: resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al eliminar proveedor del producto',
      error: error.message
    });
  }
};

// Obtener proveedores de un producto
exports.obtenerProveedores = async (req, res) => {
  try {
    const { producto_id } = req.params;

    const proveedores = await Producto.obtenerProveedores(producto_id);

    res.json({
      success: true,
      count: proveedores.length,
      data: proveedores
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al obtener proveedores del producto',
      error: error.message
    });
  }
};

// Actualizar relación con proveedor
exports.actualizarProveedorProducto = async (req, res) => {
  try {
    const { producto_id, proveedor_id } = req.params;
    const { precio_compra, codigo_proveedor } = req.body;

    if (!precio_compra) {
      return res.status(400).json({
        success: false,
        msg: 'precio_compra es requerido'
      });
    }

    const relacion = await Producto.actualizarProveedorProducto(
      producto_id,
      proveedor_id,
      precio_compra,
      codigo_proveedor
    );

    if (!relacion) {
      return res.status(404).json({
        success: false,
        msg: 'Relación no encontrada'
      });
    }

    res.json({
      success: true,
      msg: 'Relación con proveedor actualizada',
      data: relacion
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      msg: 'Error al actualizar relación con proveedor',
      error: error.message
    });
  }
};