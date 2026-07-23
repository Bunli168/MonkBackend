const express = require('express');
const router = express.Router();
const communeController = require('../controllers/communeController');

router.get('/', communeController.getAll);
router.get('/:id', communeController.getById);
router.post('/', communeController.create);
router.put('/:id', communeController.update);
router.delete('/:id', communeController.delete);

module.exports = router;
