const express = require('express');
const router = express.Router();
const {
  getAllDoctorSchedules,
  createDoctorSchedule,
  updateDoctorSchedule,
  deleteDoctorSchedule
} = require('../controllers/doctorScheduleController');

router.get('/all', getAllDoctorSchedules);
router.post('/create', createDoctorSchedule);
router.put('/update/:id', updateDoctorSchedule);
router.delete('/:id', deleteDoctorSchedule);

module.exports = router;
