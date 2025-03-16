// config/db.js
const { Pool,types } = require('pg');
require('dotenv').config();


types.setTypeParser(types.builtins.TIMESTAMP, (value) => value);

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

pool.connect()
  .then(() => console.log('PostgreSQL connected successfully'))
  .catch((err) => {
    console.error('Error connecting to PostgreSQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
