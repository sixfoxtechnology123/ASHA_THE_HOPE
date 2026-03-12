const express = require('express');
const router = express.Router();
const billingController = require('../controllers/ConsultationBillingController');

// Route to create a new bill
router.get('/next-id', billingController.getNextBillId);
router.post('/create', billingController.generateBill);

module.exports = router;
