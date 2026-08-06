const express = require('express');
const router = express.Router();
const ceremonyEventController = require('../controllers/ceremonyEventController');
const { authenticate, authorize } = require('../middleware/auth');

// 1. Get all events (accessible to SuperAdmins)
router.get('/', authenticate, authorize(['SUPERADMIN', 'ADMIN', 'MEKUDI']), ceremonyEventController.getAllEvents);

// 2. Create a new event and target Kudis (Workflow A & B)
router.post('/', authenticate, authorize(['SUPERADMIN']), ceremonyEventController.createEvent);

// 3.5 Get Monk Stats for a given Kudi (accessible to Mekudis/Admins and SuperAdmins)
router.get('/monk-stats', authenticate, authorize(['SUPERADMIN', 'ADMIN', 'MEKUDI']), ceremonyEventController.getMonkStats);

// 4. Mekudi fetches pending assignments for their Kut
router.get('/pending-assignments', authenticate, authorize(['SUPERADMIN', 'ADMIN', 'MEKUDI']), ceremonyEventController.getPendingAssignments);

// 4.0 Mekudi fetches all individual member responses for their Kut
router.get('/member-responses', authenticate, authorize(['SUPERADMIN', 'ADMIN', 'MEKUDI']), ceremonyEventController.getMemberResponses);

// 4.0 Monk fetches their assigned events
router.get('/my-assignments', authenticate, authorize(['MONK', 'BHIKKHU', 'SUPERADMIN', 'ADMIN', 'MEKUDI', 'ATTENDANCETAKER']), ceremonyEventController.getMyAssignments);

// 4.0 Monk updates their assignment status
router.put('/my-assignments/:eventId/status', authenticate, authorize(['MONK', 'BHIKKHU', 'SUPERADMIN', 'ADMIN', 'MEKUDI', 'ATTENDANCETAKER']), ceremonyEventController.updateMyAssignmentStatus);

// 4. Mekudi assigns monks to a target
router.post('/target/:id/assign', authenticate, authorize(['MEKUDI', 'SUPERADMIN', 'ADMIN']), ceremonyEventController.assignMonks);

// 4.1 Mekudi rejects an assignment target
router.post('/target/:id/reject', authenticate, authorize(['MEKUDI', 'SUPERADMIN', 'ADMIN']), ceremonyEventController.rejectAssignment);

// 5. Create an internal Kudi event directly assigning monks (Workflow C)
router.post('/internal', authenticate, authorize(['MEKUDI', 'SUPERADMIN', 'ADMIN']), ceremonyEventController.createInternalEvent);

// 6. Update an event
router.put('/:id', authenticate, authorize(['SUPERADMIN', 'ADMIN', 'MEKUDI']), ceremonyEventController.updateEvent);

// 7. Delete an event
router.delete('/:id', authenticate, authorize(['SUPERADMIN', 'ADMIN', 'MEKUDI']), ceremonyEventController.deleteEvent);

module.exports = router;
