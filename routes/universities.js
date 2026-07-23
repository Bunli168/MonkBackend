const express = require('express');
const router = express.Router();
const universityController = require('../controllers/universityController');

router.get('/', universityController.getAll);
router.post('/', universityController.create);
router.put('/:id', universityController.update);
router.delete('/:id', universityController.delete);

module.exports = router;
