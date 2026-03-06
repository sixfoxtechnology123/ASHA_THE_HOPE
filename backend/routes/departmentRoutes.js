const express = require('express');
const router = express.Router();
const { getLatestDeptId, upsertDepartment, getAllDepartments, deleteDepartment } = require('../controllers/departmentController');

router.get('/latest-id', getLatestDeptId);
router.get('/all', getAllDepartments);
router.post('/upsert', upsertDepartment);
router.delete('/:id', deleteDepartment);

module.exports = router;