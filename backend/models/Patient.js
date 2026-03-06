const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, trim: true },
    gender: { type: String, enum: ['Male', 'Female', 'Other'], default: 'Male' },
    dob: { type: String, default: '' }, // YYYY-MM-DD
    age: { type: Number, default: 0 },
    mobileNumber: { type: String, required: true, trim: true },
    alternateMobile: { type: String, default: '', trim: true },
    address: { type: String, default: '', trim: true },
    bloodGroup: { type: String, default: '', trim: true },
    allergies: { type: String, default: '', trim: true },
    knownMedicalConditions: { type: String, default: '', trim: true },
    emergencyContactName: { type: String, default: '', trim: true },
    emergencyContactNumber: { type: String, default: '', trim: true },
    department: { type: String, enum: ['General', 'Eye', 'Dental'], default: 'General' },
    notes: { type: String, default: '', trim: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
