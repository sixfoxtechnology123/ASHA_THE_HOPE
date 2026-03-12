const ConsultationBill = require('../models/ConsultationBillModel');

const getNextBillId = async () => {
    const count = await ConsultationBill.countDocuments();
    return `CB-${count + 1}`;
};

exports.getNextBillId = async (req, res) => {
    try {
        const nextId = await getNextBillId();
        res.json({ success: true, nextId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.generateBill = async (req, res) => {
    try {
        const { patientName, appointmentRef, doctorName, consultationFee, discount, paymentMode, gstApplicable } = req.body;

        // 1. Generate Custom ID (CB + Count)
        const nextId = await getNextBillId();

        // 2. Perform Calculations (Server-side for security)
        const feeValue = Number(consultationFee || 0);
        const discountValue = Number(discount || 0);
        const net = feeValue - discountValue;
        const isGstApplicable = gstApplicable !== false;
        const gst = isGstApplicable ? net * 0.18 : 0; // 18% GST example
        const final = net + gst;

        const newBill = await ConsultationBill.create({
            billId: nextId,
            patientName,
            appointmentRef,
            doctorName,
            consultationFee: feeValue,
            discount: discountValue,
            netAmount: net,
            gstApplicable: isGstApplicable,
            gstAmount: gst,
            finalAmount: final,
            paymentMode
        });

        res.status(201).json({ success: true, data: newBill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
