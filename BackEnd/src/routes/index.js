const express = require('express');
const { getHealth } = require('../controllers/healthController');

const router = express.Router();

router.get('/health', getHealth);
router.use('/auth', require('./auth'));

module.exports = router;
