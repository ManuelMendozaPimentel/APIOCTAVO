const Servicio = require('../../models/mongo/servicio');

// Crear un nuevo servicio
exports.crearServicio = async (req, res) => {
  try {
    const { nombre, descripcion, icono, creado_por, meta_titulo, meta_descripcion } = req.body;

    // Crear slug a partir del nombre
    const slug = nombre.toLowerCase().replace(/ /g, '-');

    const servicio = new Servicio({
      nombre,
      descripcion,
      icono,
      slug,
      creado_por,
      meta_titulo,
      meta_descripcion,
    });

    await servicio.save();
    res.status(201).json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener todos los servicios
exports.obtenerServicios = async (req, res) => {
  try {
    const servicios = await Servicio.find({ activo: true });
    res.status(200).json(servicios);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Obtener un servicio por slug
exports.obtenerServicioPorSlug = async (req, res) => {
  try {
    const servicio = await Servicio.findOne({ slug: req.params.slug, activo: true });
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(200).json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Actualizar un servicio
exports.actualizarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(200).json(servicio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar un servicio (eliminación lógica)
exports.eliminarServicio = async (req, res) => {
  try {
    const servicio = await Servicio.findByIdAndUpdate(
      req.params.id,
      { activo: false },
      { new: true }
    );
    if (!servicio) {
      return res.status(404).json({ error: 'Servicio no encontrado' });
    }
    res.status(200).json({ mensaje: 'Servicio desactivado correctamente' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};