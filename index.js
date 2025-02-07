// index.js

const express = require('express');
const pool = require('./config/db'); // Importa el pool de conexiones
const usuarioRoutes = require('./routes/usuarioRoutes');
const productoRoutes = require('./routes/productoRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const ventasRoutes = require('./routes/ventaRoutes'); // Importa las rutas de ventas
const path = require('path');
const cors = require('cors'); // Importa cors
require('dotenv').config();

const app = express();

// Configura cors para permitir solicitudes desde http://localhost:4200
app.use(cors({
    origin: 'http://localhost:4200',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Authorization'], // Añade esto
    credentials: true
  }));

// Conectar a la base de datos (el pool ya maneja la conexión)
// No necesitas llamar a ninguna función aquí

// Middlewares
app.use(express.json());

// Rutas
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/ventas', ventasRoutes); // Monta las rutas de ventas
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Prueba inicial
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
