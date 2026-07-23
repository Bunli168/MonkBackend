const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { reportValidation } = require('../middleware/validate');

// All reports routes require authentication
router.use(authenticate);

// Everyone can submit reports
router.post('/', authorize(['Monk', 'Student']), upload.array('images', 5), reportValidation, reportController.submit);

// Fetch all reports (filtering handled in controller/service based on role)
router.get('/', authorize(['Monk', 'Student']), reportController.getAll);

// Get report stats
router.get('/stats', authorize(['Monk', 'Student']), reportController.getStats);

// Get specific report
router.get('/:id', authorize(['Monk', 'Student']), reportController.getById);

// Only SuperAdmin (ចៅអធិការ) can update status
router.patch('/:id/status', authenticate, reportController.updateStatus);

router.put('/:id', authorize(['Monk', 'Student']), upload.array('images', 5), reportValidation, reportController.update);
router.delete('/:id', authorize(['Monk', 'Student']), reportController.delete);

module.exports = router;
