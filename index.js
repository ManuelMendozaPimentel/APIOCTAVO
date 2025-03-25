const express = require('express');
const pool = require('./config/db'); // PostgreSQL
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const ventasRoutes = require('./routes/ventaRoutes');
const path = require('path');
const cors = require('cors');
const direccionRoutes = require('./routes/direccionRoutes');
const rolRoutes = require('./routes/rolRoutes');
const servicioRoutes = require('./routes/servicioRoutes');
const proveedorRoutes = require('./routes/proveedorRoutes');
require('dotenv').config();

// Importar conexión a MongoDB
const connectMongoDB = require('./config/mongoDB');

// Importar nuevas rutas (MongoDB)
const comentarioRoutes = require('./routes/mongo/comentarioRoutes');
const respuestaRoutes = require('./routes/mongo/respuestaRoutes');

const app = express();  

// Configuración de CORS
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'],
    credentials: true
}));

// Middlewares
app.use(express.json());

// Conectar a MongoDB
connectMongoDB();

// Rutas existentes (PostgreSQL)
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/ventas', ventasRoutes);
app.use('/api/direcciones', direccionRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/servicios', servicioRoutes);

// Nuevas rutas (MongoDB)
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/respuestas', respuestaRoutes);



// Ruta para servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});