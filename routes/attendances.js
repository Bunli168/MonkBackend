const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { attendanceValidation, bulkAttendanceValidation, submitLeaveRequestValidation } = require('../middleware/validate');

router.get('/', authenticate, attendanceController.getAll);
router.get('/my-summary', authenticate, attendanceController.getMySummary);
router.get('/admin/summary', authenticate, attendanceController.getAdminSummary);
router.get('/monks-by-date', authenticate, attendanceController.getMonksByDate);
router.get('/:id', authenticate, attendanceController.getById);
router.post('/', attendanceValidation, attendanceController.create);
router.post('/bulk', bulkAttendanceValidation, attendanceController.bulkCreate);
router.put('/:id', attendanceValidation, attendanceController.update);
router.delete('/by-kut-date', attendanceController.deleteByKutAndDate);
router.delete('/:id', attendanceController.delete);
router.post('/leave-request', submitLeaveRequestValidation, attendanceController.submitLeaveRequest);

module.exports = router;
