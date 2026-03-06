const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  deptId: { type: String, required: true, unique: true },
  deptName: { type: String, required: true, unique: true },
  status: { type: String, default: 'Active' }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);