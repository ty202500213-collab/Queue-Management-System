const bcrypt = require('bcrypt');
const crypto = require('node:crypto');
const { z } = require('zod');
const pool = require('../config/db');
const { loadUser, readToken, digest, cookieName, cookieOptions } = require('../middleware/auth');
const email = z.string().trim().toLowerCase().email().max(254);
const password = z.string().min(8).refine(value => Buffer.byteLength(value, 'utf8') <= 72, 'Password must be at most 72 bytes.');
const registration = z.object({
  name: z.string().trim().min(1).max(100),
  email,
  password,
  accountType: z.enum(['student', 'staff']),
}).strict();

const login = z.object({
  email,
  password: z.string().min(1).refine(value => Buffer.byteLength(value, 'utf8') <= 72),
}).strict();

async function createSession(req, res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const previous = readToken(req);
  if (previous) {
    await pool.query('DELETE FROM auth_sessions WHERE token_hash=$1', [digest(previous)]);
  }
  await pool.query("INSERT INTO auth_sessions(token_hash,user_id,expires_at) VALUES($1,$2,NOW()+INTERVAL '8 hours')", [digest(token), userId]);
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 8 * 60 * 60 * 1000 });
}

async function register(req, res) {
  const parsed = registration.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide a name, valid email, password of 8-72 bytes, and accountType student or staff.' });
  }
  const data = parsed.data;
  const hash = await bcrypt.hash(data.password, 12);
  const client = await pool.connect();
  let id;
  try {
    await client.query('BEGIN');
    // Prevent two requests from registering the same email at the same time.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [data.email]);
    const existing = await client.query('SELECT id FROM users WHERE LOWER(email)=$1', [data.email]);
    if (existing.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ message: 'Email is already registered.' });
    }
    const result = await client.query('INSERT INTO users(name,email,password_hash) VALUES($1,$2,$3) RETURNING id', [data.name, data.email, hash]);
    id = result.rows[0].id;
    if (data.accountType === 'student') {
      await client.query('INSERT INTO students(user_id) VALUES($1)', [id]);
    } else {
      await client.query('INSERT INTO staff(user_id) VALUES($1)', [id]);
    }
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Email is already registered.' });
    }
    throw error;
  } finally {
    client.release();
  }
 
  res.status(201).json({ user: await loadUser(id) });
}

const dummyHash = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);
async function loginUser(req, res) {
  const parsed = login.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Provide a valid email and password.' });
  }
  const { rows } = await pool.query('SELECT id,password_hash FROM users WHERE LOWER(email)=$1', [parsed.data.email]);
  const valid = await bcrypt.compare(parsed.data.password, rows[0]?.password_hash || dummyHash);
  if (rows.length !== 1 || !valid) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }
  const user = await loadUser(rows[0].id);
  if (!user.accountTypes.length) {
    return res.status(403).json({ message: 'Account membership has not been configured.' });
  }
  await createSession(req, res, user.id);
  res.json({ user });
}

function getCurrentUser(req, res) {
  res.json({ user: req.user });
}
async function logout(req, res) {
  const token = readToken(req);
  if (token) {
    await pool.query('DELETE FROM auth_sessions WHERE token_hash=$1', [digest(token)]);
  }
  res.clearCookie(cookieName, cookieOptions);
  res.sendStatus(204);
}

module.exports = { register, loginUser, logout, getCurrentUser };

