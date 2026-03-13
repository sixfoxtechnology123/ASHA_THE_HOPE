const router = require('express').Router();
const { authenticate } = require('../utils/authMiddleware');
const ctrl = require('../controllers/prescriptionController');

router.get('/all', authenticate, ctrl.getPrescriptions);
router.get('/latest-id', authenticate, ctrl.getNextId);
router.post('/add', authenticate, ctrl.savePrescription);
router.put('/update/:id', authenticate, ctrl.savePrescription);
router.delete('/:id', authenticate, ctrl.deletePrescription);

module.exports = router;