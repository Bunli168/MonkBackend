const express = require('express');
const router = express.Router();
const retreatEventController = require('../controllers/retreatEventController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Global status routes
router.get('/current', retreatEventController.getCurrent);
router.post('/start-season', authenticate, retreatEventController.startSeason);
router.post('/close-season', authenticate, retreatEventController.closeSeason);

// Legacy route for history
router.get('/', authenticate, retreatEventController.getAll);

module.exports = router;
