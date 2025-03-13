const bcrypt = require('bcrypt');
const passwordPlana = '12345678';

async function hashPassword(password) {
    try {
      const saltRounds = 10; // Número de rondas de salting (recomendado: 10)
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('Contraseña hasheada:', hashedPassword);
      return hashedPassword;
    } catch (error) {
      console.error('Error al hashear la contraseña:', error);
    }
  }
  
  // Llama a la función con la contraseña en texto plano
  hashPassword('AdminPassword123!');