const express = require('express');
const router = express.Router();
const retreatEventController = require('../controllers/retreatEventController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Global status routes
router.get('/current', retreatEventController.getCurrent);
router.post('/start-season', authenticate, authorize(['Super Admin', 'Superadmin', 'SuperAdmin']), retreatEventController.startSeason);
router.post('/toggle-season/:id?', authenticate, authorize(['Super Admin', 'Superadmin', 'SuperAdmin']), retreatEventController.toggleSeason);
router.put('/:id', authenticate, authorize(['Super Admin', 'Superadmin', 'SuperAdmin']), retreatEventController.editSeason);

// Legacy route for history
router.get('/', authenticate, retreatEventController.getAll);

module.exports = router;
