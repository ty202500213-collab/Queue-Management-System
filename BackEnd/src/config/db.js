const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../../.env'), quiet: true });
const { Pool } = require('pg');

let databaseConfig;

if (process.env.DATABASE_URL) {
  databaseConfig = { connectionString: process.env.DATABASE_URL };
} else {
  databaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
}

databaseConfig.connectionTimeoutMillis = 5000;
const pool = new Pool(databaseConfig);

pool.on('error', (error) => {
  console.error('Unexpected database connection error:', error);
});

module.exports = pool;
