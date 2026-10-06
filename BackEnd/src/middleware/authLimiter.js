
const attempts = new Map();
const timer = setInterval(() => {
  for (const [ip, value] of attempts) {
    if (value.until <= Date.now()) {
      attempts.delete(ip);
    }
  }
}, 60000);
timer.unref();
function throttle(req, res, next) {
  const now = Date.now();
  let entry = attempts.get(req.ip);
  if (!entry || entry.until <= now) {
    entry = { count: 0, until: now + 15 * 60000 };
    attempts.set(req.ip, entry);
  }
  entry.count += 1;
  if (entry.count > 30) {
    res.set('Retry-After', String(Math.ceil((entry.until - now) / 1000)));
    return res.status(429).json({ message: 'Too many attempts. Try again later.' });
  }
  next();
}

module.exports = throttle;
