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
        const { patientName, patientPhone, appointmentRef, doctorName, consultationFee, discount, paymentMode, gstRate } = req.body;

        // 1. Generate Custom ID (CB + Count)
        const nextId = await getNextBillId();

        // 2. Perform Calculations (Server-side for security)
        const feeValue = Number(consultationFee || 0);
        const discountValue = Number(discount || 0);
        const net = feeValue - discountValue;
        const rateValue = Number(gstRate || 0);
        const gst = rateValue > 0 ? (net * rateValue) / 100 : 0;
        const final = net + gst;

        const newBill = await ConsultationBill.create({
            billId: nextId,
            patientName,
            patientPhone: patientPhone || '',
            appointmentRef,
            doctorName,
            consultationFee: feeValue,
            discount: discountValue,
            netAmount: net,
            gstRate: rateValue,
            gstAmount: gst,
            finalAmount: final,
            paymentMode
        });

        res.status(201).json({ success: true, data: newBill });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllBills = async (req, res) => {
    try {
        const bills = await ConsultationBill.find().sort({ createdAt: -1 });
        res.json({ success: true, data: bills });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBill = async (req, res) => {
    try {
        const { patientName, patientPhone, appointmentRef, doctorName, consultationFee, discount, paymentMode, gstRate } = req.body;
        const feeValue = Number(consultationFee || 0);
        const discountValue = Number(discount || 0);
        const net = feeValue - discountValue;
        const rateValue = Number(gstRate || 0);
        const gst = rateValue > 0 ? (net * rateValue) / 100 : 0;
        const final = net + gst;

        const updated = await ConsultationBill.findByIdAndUpdate(
            req.params.id,
            {
                patientName,
                patientPhone: patientPhone || '',
                appointmentRef,
                doctorName,
                consultationFee: feeValue,
                discount: discountValue,
                netAmount: net,
                gstRate: rateValue,
                gstAmount: gst,
                finalAmount: final,
                paymentMode
            },
            { new: true }
        );

        if (!updated) return res.status(404).json({ success: false, message: 'Bill not found' });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBill = async (req, res) => {
    try {
        const deleted = await ConsultationBill.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Bill not found' });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
