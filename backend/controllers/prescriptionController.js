const Prescription = require('../models/Prescription');

exports.getPrescriptions = async (req, res) => {
  try {
    const data = await Prescription.find().populate('doctor patient').sort({ createdAt: -1 });
    res.json({ success: true, data });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.getNextId = async (req, res) => {
  const { type } = req.query;
  const count = await Prescription.countDocuments({ type });
  const prefix = type === 'digital' ? 'DP' : 'HP';
  res.json({ success: true, nextId: `${prefix}-${count + 1}` });
};

exports.savePrescription = async (req, res) => {
  try {
    const { id } = req.params;
    if (id) {
      const updated = await Prescription.findByIdAndUpdate(id, req.body, { new: true });
      return res.json({ success: true, data: updated });
    }
    const newDoc = new Prescription(req.body);
    await newDoc.save();
    res.json({ success: true, data: newDoc });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

exports.deletePrescription = async (req, res) => {
  try {
    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};