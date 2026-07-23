const express = require('express');
const router = express.Router();
const leaveRequestController = require('../controllers/leaveRequestController');
const { authenticate, authorize } = require('../middleware/auth');
const { leaveRequestValidation } = require('../middleware/validate');

// Monks create a leave request
router.post('/', authenticate, authorize(['MONK', 'BHIKKHU', 'ATTENDANCETAKER']), leaveRequestValidation, leaveRequestController.createRequest);

// Monks get their own requests
router.get('/my', authenticate, authorize(['MONK', 'BHIKKHU', 'ATTENDANCETAKER']), leaveRequestController.getMyRequests);

// Admin/Mekudi get all requests
router.get('/', authenticate, leaveRequestController.getAllRequests);

// Admin/Mekudi approve/reject
router.put('/:id/status', authenticate, leaveRequestController.updateStatus);

module.exports = router;
