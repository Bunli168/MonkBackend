const express = require('express');
const router = express.Router();
const seatingRowController = require('../controllers/seatingRowController');
const { seatingRowValidation } = require('../middleware/validate');

router.get('/', seatingRowController.getAll);
router.get('/:id', seatingRowController.getById);
router.get('/:id/taken-seats', seatingRowController.getTakenSeats);
router.post('/', seatingRowValidation, seatingRowController.create);
router.post('/bulk-capacity', seatingRowController.bulkSetCapacity);
router.post('/initialize', seatingRowController.initializeRows);
router.post('/assign-taker', seatingRowController.assignTaker);
router.post('/delete-all', seatingRowController.deleteAll);
router.put('/:id', seatingRowValidation, seatingRowController.update);
router.delete('/:id', seatingRowController.delete);

module.exports = router;
