const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

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
      appointmentId: payload.appointmentId || '',
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

exports.getPatientById = async (req, res) => {
  try {
    const data = await Patient.findById(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });
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

const loadDoctorMeta = async (doctorId) => {
  if (!doctorId) return null;
  return Doctor.findOne({ doctorId }).select('doctorName department consultationFee').lean();
};

exports.getVisitHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('visitHistory');
    if (!patient) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });
    return res.json({ success: true, data: patient.visitHistory || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addVisitHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });

    const payload = { ...req.body };
    if (!payload.visitDate || !payload.doctorId) {
      return res.status(400).json({ success: false, message: 'VISIT DATE AND DOCTOR REQUIRED' });
    }

    if (!payload.doctorName || !payload.department) {
      const doctor = await loadDoctorMeta(payload.doctorId);
      if (doctor) {
        payload.doctorName = payload.doctorName || doctor.doctorName;
        payload.department = payload.department || doctor.department;
      }
    }

    if (!payload.doctorName || !payload.department) {
      return res.status(400).json({ success: false, message: 'DOCTOR DETAILS MISSING' });
    }

    const entry = {
      patientId: patient.patientId,
      patientName: patient.fullName,
      visitDate: payload.visitDate,
      doctorId: payload.doctorId,
      doctorName: payload.doctorName,
      department: payload.department,
      status: payload.status || 'Scheduled',
      prescriptionUrl: payload.prescriptionUrl || ''
    };

    patient.visitHistory.unshift(entry);
    await patient.save();
    return res.status(201).json({ success: true, message: 'VISIT HISTORY SAVED', data: entry });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getBillingHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('billingHistory');
    if (!patient) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });
    return res.json({ success: true, data: patient.billingHistory || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addBillingHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });

    const payload = { ...req.body };
    if (!payload.invoiceNo || !payload.billDate) {
      return res.status(400).json({ success: false, message: 'INVOICE NO AND DATE REQUIRED' });
    }

    if (payload.doctorId && (!payload.doctorName || !payload.department || !payload.amount)) {
      const doctor = await loadDoctorMeta(payload.doctorId);
      if (doctor) {
        payload.doctorName = payload.doctorName || doctor.doctorName;
        payload.department = payload.department || doctor.department;
        if (!payload.amount || Number(payload.amount) <= 0) {
          payload.amount = Number(doctor.consultationFee) || 0;
        }
      }
    }

    const entry = {
      patientId: patient.patientId,
      patientName: patient.fullName,
      invoiceNo: payload.invoiceNo,
      billDate: payload.billDate,
      doctorId: payload.doctorId || '',
      doctorName: payload.doctorName || '',
      department: payload.department || '',
      amount: Number(payload.amount) || 0,
      paymentStatus: payload.paymentStatus || 'Unpaid'
    };

    patient.billingHistory.unshift(entry);
    await patient.save();
    return res.status(201).json({ success: true, message: 'BILLING HISTORY SAVED', data: entry });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.getPharmacyHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('pharmacyHistory');
    if (!patient) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });
    return res.json({ success: true, data: patient.pharmacyHistory || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.addPharmacyHistory = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id);
    if (!patient) return res.status(404).json({ success: false, message: 'PATIENT NOT FOUND' });

    const payload = { ...req.body };
    if (!payload.billNo || !payload.medicinesPurchased) {
      return res.status(400).json({ success: false, message: 'BILL NO AND MEDICINES REQUIRED' });
    }

    const entry = {
      patientId: patient.patientId,
      patientName: patient.fullName,
      billNo: payload.billNo,
      medicinesPurchased: payload.medicinesPurchased,
      amount: Number(payload.amount) || 0
    };

    patient.pharmacyHistory.unshift(entry);
    await patient.save();
    return res.status(201).json({ success: true, message: 'PHARMACY HISTORY SAVED', data: entry });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};
