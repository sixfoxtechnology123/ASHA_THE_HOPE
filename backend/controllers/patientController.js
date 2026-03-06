const Patient = require('../models/Patient');

const getAgeFromDob = (dob) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age < 0 ? 0 : age;
};

const getNextPatientId = async () => {
  const last = await Patient.findOne().sort({ createdAt: -1 }).select('patientId');
  if (!last?.patientId) return 'P-1';
  const numericPart = Number(String(last.patientId).replace('P-', ''));
  if (!Number.isInteger(numericPart) || numericPart < 1) return 'P-1';
  return `P-${numericPart + 1}`;
};

exports.getLatestPatientId = async (req, res) => {
  try {
    const nextId = await getNextPatientId();
    return res.json({ success: true, nextId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerPatient = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.patientId = await getNextPatientId();
    payload.age = getAgeFromDob(payload.dob);

    if (!payload.mobileNumber || !String(payload.mobileNumber).trim()) {
      return res.status(400).json({ success: false, message: 'MOBILE NUMBER IS REQUIRED' });
    }

    const doc = new Patient({
      patientId: payload.patientId,
      fullName: payload.fullName || '',
      gender: payload.gender || 'Male',
      dob: payload.dob || '',
      age: payload.age,
      mobileNumber: payload.mobileNumber,
      alternateMobile: payload.alternateMobile || '',
      address: payload.address || '',
      bloodGroup: payload.bloodGroup || '',
      allergies: payload.allergies || '',
      knownMedicalConditions: payload.knownMedicalConditions || '',
      emergencyContactName: payload.emergencyContactName || '',
      emergencyContactNumber: payload.emergencyContactNumber || '',
      department: payload.department || 'General',
      notes: payload.notes || ''
    });

    await doc.save();
    return res.status(201).json({ success: true, message: 'PATIENT REGISTERED', data: doc });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.patientId) {
      return res.status(409).json({ success: false, message: 'PATIENT ID CONFLICT, RETRY' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getAllPatients = async (req, res) => {
  try {
    const data = await Patient.find().sort({ createdAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePatient = async (req, res) => {
  try {
    const payload = { ...req.body };
    const patientId = req.params.id;

    if (!payload.mobileNumber || !String(payload.mobileNumber).trim()) {
      return res.status(400).json({ success: false, message: 'MOBILE NUMBER IS REQUIRED' });
    }

    payload.age = getAgeFromDob(payload.dob);
    delete payload.patientId;

    const updated = await Patient.findByIdAndUpdate(patientId, payload, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });
    }

    return res.json({ success: true, message: 'PATIENT UPDATED', data: updated });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const deleted = await Patient.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });
    }
    return res.json({ success: true, message: 'PATIENT DELETED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
