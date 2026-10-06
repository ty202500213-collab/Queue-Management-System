const fs = require('node:fs/promises');
const path = require('node:path');
const { Client } = require('pg');
const pool = require('../src/config/db');

async function initialize() {
  try {
    await pool.query('SELECT 1');
  } catch (error) {
    if (error.code !== '3D000') throw error;

    let database;
    let config;
    if (process.env.DATABASE_URL) {
      const url = new URL(process.env.DATABASE_URL);
      database = decodeURIComponent(url.pathname.slice(1));
      url.pathname = '/postgres';
      config = { connectionString: url.toString(), connectionTimeoutMillis: 5000 };
    } else {
      database = process.env.DB_NAME;
      config = { ...pool.options, database: 'postgres' };
    }
    if (!database) throw new Error('Set DATABASE_URL or DB_NAME in .env.');

    const admin = new Client(config);
    try {
      await admin.connect();
      const existing = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [database]);
      if (!existing.rowCount) {
        await admin.query(`CREATE DATABASE "${database.replace(/"/g, '""')}"`);
        console.log('Created configured database.');
      }
    } finally {
      await admin.end();
    }
  }

  const schema = await fs.readFile(path.join(__dirname, '../src/config/DB_Schema.sql'), 'utf8');
  if (!schema.trim()) throw new Error('DB_Schema.sql is empty. Add table definitions first.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema);
    await client.query('COMMIT');
    console.log('Database schema initialized successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

initialize().catch((error) => {
  console.error(`Database setup failed (${error.code || error.name}). Check PostgreSQL, credentials, permissions, and DB_Schema.sql.`);
  process.exitCode = 1;
}).finally(() => pool.end());

