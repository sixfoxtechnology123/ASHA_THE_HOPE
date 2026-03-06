const mongoose = require('mongoose');

const doctorScheduleSchema = new mongoose.Schema(
  {
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true, min: 2000, max: 2100 },
    days: {
      type: [String],
      required: true,
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: 'At least one day must be selected'
      }
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotDuration: { type: Number, required: true, min: 1 },
    breakStartTime: { type: String, default: '' },
    breakEndTime: { type: String, default: '' },
    bookingMode: {
      type: String,
      enum: ['Slot Based', 'FCFS', 'Hybrid'],
      default: 'Slot Based'
    },
    maxPatientsPerDay: { type: Number, default: null, min: 1 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('DoctorSchedule', doctorScheduleSchema);
