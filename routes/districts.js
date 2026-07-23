const express = require('express');
const router = express.Router();
const districtController = require('../controllers/districtController');

router.get('/', districtController.getAll);
router.get('/:id', districtController.getById);
router.post('/', districtController.create);
router.put('/:id', districtController.update);
router.delete('/:id', districtController.delete);

module.exports = router;
