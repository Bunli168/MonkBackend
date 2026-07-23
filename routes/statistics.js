const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authorize, authenticate } = require('../middleware/auth');

// SuperAdmin and Admin can view stats
router.get('/admin', authenticate, statisticsController.getAdminStats);

module.exports = router;
