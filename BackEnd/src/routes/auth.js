const express = require('express');
const { register, loginUser, logout, getCurrentUser } = require('../controllers/authController');
const { authenticate, checkOrigin } = require('../middleware/auth');
const limitAuthAttempts = require('../middleware/authLimiter');

const router = express.Router();

router.post('/register', checkOrigin, limitAuthAttempts, register);
router.post('/login', checkOrigin, limitAuthAttempts, loginUser);
router.get('/me', authenticate, getCurrentUser);
router.post('/logout', checkOrigin, logout);

module.exports = router;
