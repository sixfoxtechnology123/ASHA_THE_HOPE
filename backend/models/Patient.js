const mongoose = require('mongoose');

const visitHistorySchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    patientName: { type: String, default: '' },
    visitDate: { type: String, required: true }, // YYYY-MM-DD
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    department: { type: String, required: true },
    status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled'], default: 'Scheduled' },
    prescriptionUrl: { type: String, default: '' }
  },
  { timestamps: true }
);

const billingHistorySchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    patientName: { type: String, default: '' },
    invoiceNo: { type: String, required: true },
    billDate: { type: String, required: true }, // YYYY-MM-DD
    doctorId: { type: String, default: '' },
    doctorName: { type: String, default: '' },
    department: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['Paid', 'Unpaid', 'Partial'], default: 'Unpaid' }
  },
  { timestamps: true }
);

const pharmacyHistorySchema = new mongoose.Schema(
  {
    patientId: { type: String, required: true },
    patientName: { type: String, default: '' },
    billNo: { type: String, required: true },
    medicinesPurchased: { type: String, required: true },
    amount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

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
    department: { type: String, default: 'General' },
    appointmentId: { type: String, default: '' },
    notes: { type: String, default: '', trim: true },
    visitHistory: { type: [visitHistorySchema], default: [] },
    billingHistory: { type: [billingHistorySchema], default: [] },
    pharmacyHistory: { type: [pharmacyHistorySchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patient', patientSchema);
