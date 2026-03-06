const express = require('express');
const router = express.Router();
const {
  getLatestPatientId,
  registerPatient,
  getAllPatients,
  updatePatient,
  deletePatient
} = require('../controllers/patientController');

router.get('/latest-id', getLatestPatientId);
router.post('/register', registerPatient);
router.get('/all', getAllPatients);
router.put('/update/:id', updatePatient);
router.delete('/:id', deletePatient);

module.exports = router;
