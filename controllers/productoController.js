const Producto = require('../models/producto');
const Categoria = require('../models/categoria');

// Crear un nuevo producto
exports.crearProducto = async (req, res) => {
  try {
    const { nombre, descripcion, precio, id_categoria, sku, stock } = req.body;
    const imagen_url = req.file ? req.file.filename : req.body.imagen_url;

    // Validar SKU único
    const skuExistente = await Producto.obtenerProductoPorSku(sku);
    if (skuExistente) {
      return res.status(400).json({ msg: 'El SKU ya está registrado' });
    }

    // Verificar si la categoría existe
    if (id_categoria) {
      const categoriaExistente = await Categoria.obtenerPorId(id_categoria);
      if (!categoriaExistente) {
        return res.status(404).json({ msg: 'Categoría no encontrada' });
      }
    }

    const nuevoProducto = await Producto.crearProducto({
      nombre,
      descripcion,
      precio,
      categoria_id: id_categoria || null,
      imagen_url,
      stock,
      sku,
      creado_por: req.user.id, // Registrar quién creó el producto
    });

    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al crear el producto', error: error.message });
  }
};

exports.obtenerProductos = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoria_id, min_precio, max_precio, disponible } = req.query;

    // Validar que page y limit sean números enteros positivos
    const pageInt = parseInt(page, 10);
    const limitInt = parseInt(limit, 10);

    if (isNaN(pageInt) || pageInt < 1) {
      throw new Error('El parámetro "page" debe ser un número entero positivo');
    }
    if (isNaN(limitInt) || limitInt < 1) {
      throw new Error('El parámetro "limit" debe ser un número entero positivo');
    }

    const productos = await Producto.obtenerProductos({
      page: pageInt,
      limit: limitInt,
      categoria_id,
      min_precio: parseFloat(min_precio),
      max_precio: parseFloat(max_precio),
      disponible: disponible === 'true',
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

exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const datosActualizacion = req.body;

    // Lista de campos permitidos para actualización
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

    // Registrar quién actualizó el producto
    datosFiltrados.modificado_por = req.user.id;

    // Actualizar el producto
    const productoActualizado = await Producto.actualizarProducto(id, datosFiltrados);

    // Registrar la acción en la auditoría
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

exports.aumentarStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null || cantidad <= 0) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio y debe ser un número positivo' });
    }

    // Obtener el producto antes de aumentar el stock
    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Aumentar el stock
    const productoActualizado = await Producto.aumentarStock(id, cantidad, req.user.id);

    // Registrar el cambio en el historial de stock
    await Producto.registrarHistorialStock(
      id,
      req.user.id,
      producto.stock, // Cantidad anterior
      productoActualizado.stock, // Cantidad nueva
      'Aumento de stock' // Motivo
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al aumentar el stock', error: error.message });
  }
};

exports.ajustarStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null || cantidad < 0) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio y debe ser un número no negativo' });
    }

    // Obtener el producto antes de ajustar el stock
    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Ajustar el stock
    const productoActualizado = await Producto.ajustarStock(id, cantidad, req.user.id);

    // Registrar el cambio en el historial de stock
    await Producto.registrarHistorialStock(
      id,
      req.user.id,
      producto.stock, // Cantidad anterior
      productoActualizado.stock, // Cantidad nueva
      'Ajuste de stock' // Motivo
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al ajustar el stock', error: error.message });
  }
};

exports.reducirStockProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const { cantidad } = req.body;

    if (cantidad === undefined || cantidad === null || cantidad <= 0) {
      return res.status(400).json({ msg: 'El campo "cantidad" es obligatorio y debe ser un número positivo' });
    }

    // Obtener el producto antes de reducir el stock
    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Validar que el stock no sea menor que la cantidad a reducir
    if (producto.stock < cantidad) {
      return res.status(400).json({ msg: 'No hay suficiente stock para reducir' });
    }

    // Reducir el stock
    const productoActualizado = await Producto.reducirStock(id, cantidad, req.user.id);

    // Registrar el cambio en el historial de stock
    await Producto.registrarHistorialStock(
      id,
      req.user.id,
      producto.stock, // Cantidad anterior
      productoActualizado.stock, // Cantidad nueva
      'Reducción de stock' // Motivo
    );

    res.status(200).json(productoActualizado);
  } catch (error) {
    res.status(500).json({ msg: 'Error al reducir el stock', error: error.message });
  }
};

exports.obtenerHistorialStock = async (req, res) => {
  try {
    const { id } = req.params;
    const historial = await Producto.obtenerHistorialStock(id);
    res.status(200).json(historial);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener el historial de stock', error: error.message });
  }
};

exports.obtenerAuditoriaProducto = async (req, res) => {
  try {
    const { id } = req.params;
    const auditoria = await Producto.obtenerAuditoriaProducto(id);
    res.status(200).json(auditoria);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener la auditoría del producto', error: error.message });
  }
};


exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el producto antes de marcarlo como inactivo
    const producto = await Producto.obtenerProductoPorId(id);
    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    // Marcar el producto como inactivo
    const productoEliminado = await Producto.eliminarProducto(id, req.user.id);

    // Registrar la acción en la auditoría
    await Producto.registrarAuditoriaProducto(
      id,
      req.user.id,
      'eliminar_logico', // Usar 'eliminar_logico' en lugar de 'eliminar'
      { detalles: 'Producto marcado como inactivo' }
    );

    res.status(200).json({ msg: 'Producto marcado como inactivo', producto: productoEliminado });
  } catch (error) {
    res.status(500).json({ msg: 'Error al eliminar el producto', error: error.message });
  }
};

exports.obtenerProductoPorSku = async (req, res) => {
  try {
    const { sku } = req.params;

    // Validar que el SKU no esté vacío
    if (!sku || typeof sku !== 'string' || sku.trim() === '') {
      return res.status(400).json({ msg: 'El SKU es obligatorio y debe ser una cadena de texto válida' });
    }

    // Obtener el producto por SKU
    const producto = await Producto.obtenerProductoPorSku(sku.trim());

    if (!producto) {
      return res.status(404).json({ msg: 'Producto no encontrado' });
    }

    res.status(200).json(producto);
  } catch (error) {
    res.status(500).json({ msg: 'Error al obtener el producto por SKU', error: error.message });
  }
};