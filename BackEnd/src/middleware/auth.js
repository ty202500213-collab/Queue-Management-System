const crypto = require('node:crypto');
const pool = require('../config/db');

const cookieName = 'campus_session';
const cookieOptions = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api' };
const digest = token => crypto.createHash('sha256').update(token).digest('hex');

function readToken(req) {
  const cookies = (req.headers.cookie || '').split(';');
  for (const cookie of cookies) {
    const value = cookie.trim();
    if (value.startsWith(`${cookieName}=`)) {
      const token = value.slice(cookieName.length + 1);
      if (/^[a-f0-9]{64}$/.test(token)) {
        return token;
      }
    }
  }
  return null;
}

async function loadUser(id) {
  const { rows } = await pool.query(`SELECT u.id, u.name, u.email, u.created_at,
    EXISTS(SELECT 1 FROM students WHERE user_id=u.id) AS student,
    EXISTS(SELECT 1 FROM staff WHERE user_id=u.id) AS staff,
    EXISTS(SELECT 1 FROM cafeteria_staff WHERE user_id=u.id) AS cafeteria_staff
    FROM users u WHERE u.id=$1`, [id]);
  if (!rows[0]) {
    return null;
  }
  const { student, staff, cafeteria_staff, ...user } = rows[0];
  const accountTypes = [];
  if (student) accountTypes.push('student');
  if (staff) accountTypes.push('staff');
  if (cafeteria_staff) accountTypes.push('cafeteria_staff');
  return { ...user, accountTypes };
}

async function authenticate(req, res, next) {
  const token = readToken(req);
  if (!token) {
    return res.status(401).json({ message: 'Please log in.' });
  }
  const { rows } = await pool.query('SELECT user_id FROM auth_sessions WHERE token_hash=$1 AND expires_at > NOW()', [digest(token)]);
  if (!rows[0]) {
    return res.status(401).json({ message: 'Session expired. Please log in.' });
  }
  req.user = await loadUser(rows[0].user_id);
  if (!req.user) {
    return res.status(401).json({ message: 'Session expired. Please log in.' });
  }
  next();
}

function authorize(...types) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Please log in.' });
    }
    if (!types.some(type => req.user.accountTypes.includes(type))) {
      return res.status(403).json({ message: 'You do not have permission.' });
    }
    next();
  };
}

function checkOrigin(req, res, next) {
  const expected = process.env.FRONTEND_URL || 'http://localhost:5173';
  if ((req.headers.origin && req.headers.origin !== expected) || req.headers['sec-fetch-site'] === 'cross-site') {
    return res.status(403).json({ message: 'Request origin is not allowed.' });
  }
  next();
}

module.exports = { authenticate, authorize, checkOrigin, loadUser, readToken, digest, cookieName, cookieOptions };
