const Department = require('../models/Department');

// 1. GET NEXT ID
exports.getLatestDeptId = async (req, res) => {
  try {
    const lastDept = await Department.findOne().sort({ deptId: -1 });
    let nextId = "DEPT-0001";

    if (lastDept && lastDept.deptId) {
      const lastNum = parseInt(lastDept.deptId.replace("DEPT-", ""), 10);
      nextId = `DEPT-${String(lastNum + 1).padStart(4, '0')}`;
    }
    res.json({ success: true, nextId });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// 2. UPSERT (ADD/UPDATE)
exports.upsertDepartment = async (req, res) => {
  try {
    const { id, deptId, deptName } = req.body;
    const formattedName = deptName.toUpperCase();

    if (id) {
      const updated = await Department.findByIdAndUpdate(id, { deptName: formattedName }, { new: true });
      return res.json({ success: true, message: "Department Updated", data: updated });
    } else {
      const existing = await Department.findOne({ deptName: formattedName });
      if (existing) return res.status(400).json({ success: false, message: "Department already exists" });

      const newDept = new Department({ deptId, deptName: formattedName });
      await newDept.save();
      res.status(201).json({ success: true, message: "Department Saved", data: newDept });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. GET ALL
exports.getAllDepartments = async (req, res) => {
  try {
    const data = await Department.find().sort({ deptId: 1 });
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. DELETE
exports.deleteDepartment = async (req, res) => {
  try {
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};