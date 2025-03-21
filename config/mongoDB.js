const mongoose = require('mongoose');
require('dotenv').config();

const conectarMongoDB = async () => {
  try {
    // Validar que la URI de MongoDB esté definida
    if (!process.env.MONGO_URI) {
      console.error('❌ La variable de entorno MONGO_URI no está definida.');
      process.exit(1);
    }

    // Opciones de conexión
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Esperar 5 segundos para seleccionar el servidor
      socketTimeoutMS: 45000, // Esperar 45 segundos para operaciones de socket
    };

    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGO_URI, options);
    console.log('✅ MongoDB conectado correctamente.');
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error.message);
    process.exit(1);
  }
};

// Eventos de conexión
mongoose.connection.on('connected', () => {
  console.log('🟢 Mongoose conectado a la base de datos.');
});

mongoose.connection.on('error', (err) => {
  console.error('🔴 Error en la conexión de Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('🟡 Mongoose desconectado de la base de datos.');
});

// Manejar cierre de la aplicación
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('⛔ Conexión a MongoDB cerrada debido a la terminación de la aplicación.');
  process.exit(0);
});

module.exports = conectarMongoDB;