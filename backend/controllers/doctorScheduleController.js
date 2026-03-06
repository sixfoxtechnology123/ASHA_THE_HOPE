const DoctorSchedule = require('../models/DoctorSchedule');

exports.getAllDoctorSchedules = async (req, res) => {
  try {
    const schedules = await DoctorSchedule.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: schedules });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createDoctorSchedule = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      maxPatientsPerDay: req.body.maxPatientsPerDay === '' ? null : req.body.maxPatientsPerDay
    };
    const newSchedule = new DoctorSchedule(payload);
    await newSchedule.save();
    return res.status(201).json({ success: true, message: 'Doctor Schedule Saved', data: newSchedule });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateDoctorSchedule = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      maxPatientsPerDay: req.body.maxPatientsPerDay === '' ? null : req.body.maxPatientsPerDay
    };
    const updated = await DoctorSchedule.findByIdAndUpdate(req.params.id, payload, { new: true });
    return res.json({ success: true, message: 'Doctor Schedule Updated', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteDoctorSchedule = async (req, res) => {
  try {
    await DoctorSchedule.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'Doctor Schedule Deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
