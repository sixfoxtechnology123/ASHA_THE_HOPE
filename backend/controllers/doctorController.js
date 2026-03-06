const Doctor = require('../models/Doctor');

// 1. GENERATE NEXT ID (DOC-0001 format)
exports.getLatestDoctorId = async (req, res) => {
  try {
    const lastDoc = await Doctor.findOne().sort({ doctorId: -1 });
    let nextId = "DOC-0001";

    if (lastDoc && lastDoc.doctorId) {
      // Extract number from DOC-0001, increment it, and pad with zeros
      const lastNum = parseInt(lastDoc.doctorId.replace("DOC-", ""), 10);
      nextId = `DOC-${String(lastNum + 1).padStart(4, '0')}`;
    }
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. REGISTER NEW DOCTOR
exports.registerDoctor = async (req, res) => {
  try {
    const newDoctor = new Doctor(req.body);
    await newDoctor.save();
    res.status(201).json({ success: true, message: "Doctor Registered", data: newDoctor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 3. UPDATE DOCTOR
exports.updateDoctor = async (req, res) => {
  try {
    const updatedDoctor = await Doctor.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    );
    res.json({ success: true, message: "Doctor Updated Successfully", data: updatedDoctor });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// 4. GET ALL DOCTORS (For List Page)
exports.getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().sort({ createdAt: -1 });
    res.json({ success: true, data: doctors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 5. DELETE DOCTOR
exports.deleteDoctor = async (req, res) => {
  try {
    await Doctor.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Doctor Deleted Successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};