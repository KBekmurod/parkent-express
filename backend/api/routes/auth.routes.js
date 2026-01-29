const express = require('express');
const router = express.Router();
const { authController } = require('../controllers');
const { verifyToken, authLimiter } = require('../../middleware');

router.post('/login', authLimiter, authController.login);
router.get('/verify', verifyToken, authController.verifyToken);

module.exports = router;
