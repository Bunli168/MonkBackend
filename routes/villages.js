const express = require('express');
const router = express.Router();
const villageController = require('../controllers/villageController');

router.get('/', villageController.getAll);
router.get('/:id', villageController.getById);
router.post('/', villageController.create);
router.put('/:id', villageController.update);
router.delete('/:id', villageController.delete);

module.exports = router;
