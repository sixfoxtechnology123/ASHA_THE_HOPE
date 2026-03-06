const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, required: true, unique: true },
  doctorName: { type: String, required: true },
  qualification: { type: String, required: true },
  specialization: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true },
  department: { type: String, required: true },
  consultationFee: { type: Number, required: true },
  revenueShareType: { type: String, enum: ['Percentage', 'Fixed'], default: 'Percentage' },
  doctorShare: { type: Number, required: false },
  centerShare: { type: Number, required: false},
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  joiningDate: { type: Date, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);