const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true });

const app = require('./src/app');
const pool = require('./src/config/db');
const port = Number(process.env.PORT || 5000);

async function start() {
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a number between 1 and 65535.');
  }
  await pool.query('SELECT 1');
  const server = app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
  server.on('error', async (error) => {
    console.error(error.code === 'EADDRINUSE'
      ? `Port ${port} is already in use. Stop the other server or change PORT in .env.`
      : `Server failed to start (${error.code || error.name}).`);
    await pool.end();
    process.exitCode = 1;
  });
  const shutdown = () => {
    server.close(async () => {
      await pool.end();
      process.exitCode = 0;
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

start().catch(async (error) => {
  console.error(error.code === '3D000'
    ? 'Database does not exist. Run npm run db:init first.'
    : `Backend startup failed (${error.code || error.message}). Check your database configuration and PostgreSQL service.`);
  await pool.end();
  process.exitCode = 1;
});
