const Appointment = require('../models/Appointment');

const getNextTokenNumber = async () => {
  const last = await Appointment.findOne().sort({ tokenNumber: -1 }).select('tokenNumber');
  return last?.tokenNumber ? Number(last.tokenNumber) + 1 : 1;
};

const getNextAppointmentId = async () => {
  const count = await Appointment.countDocuments();
  return `AB-${count + 1}`;
};

exports.getAllAppointments = async (req, res) => {
  try {
    const data = await Appointment.find().sort({ createdAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNextAppointmentId = async (req, res) => {
  try {
    const nextId = await getNextAppointmentId();
    return res.json({ success: true, nextId });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getNextToken = async (req, res) => {
  try {
    const nextToken = await getNextTokenNumber();
    return res.json({ success: true, nextToken });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAppointment = async (req, res) => {
  try {
    const payload = { ...req.body };

    payload.appointmentId = payload.appointmentId || await getNextAppointmentId();

    if (payload.tokenAutoGenerate === 'Yes') {
      payload.tokenNumber = await getNextTokenNumber();
    } else {
      payload.tokenNumber = Number(payload.tokenNumber);
      if (!Number.isInteger(payload.tokenNumber) || payload.tokenNumber < 1) {
        return res.status(400).json({ success: false, message: 'INVALID TOKEN NUMBER' });
      }
    }

    if (payload.bookingType === 'Slot' && !payload.selectedSlot) {
      return res.status(400).json({ success: false, message: 'SLOT REQUIRED FOR SLOT BOOKING' });
    }

    const exists = await Appointment.findOne({
      doctorId: payload.doctorId,
      appointmentDate: payload.appointmentDate,
      selectedSlot: payload.bookingType === 'Slot' ? payload.selectedSlot : ''
    });

    if (exists && payload.bookingType === 'Slot') {
      return res.status(409).json({ success: false, message: 'SELECTED SLOT ALREADY BOOKED' });
    }

    const doc = new Appointment({
      ...payload,
      notes: payload.notes || '',
      patientSearch: payload.patientSearch || '',
      patientName: payload.patientName || '',
      patientMobile: payload.patientMobile || '',
      availableSlotsAtBooking: Array.isArray(payload.availableSlotsAtBooking) ? payload.availableSlotsAtBooking : []
    });
    await doc.save();

    return res.status(201).json({ success: true, message: 'APPOINTMENT SAVED', data: doc });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.tokenNumber) {
      return res.status(409).json({ success: false, message: 'TOKEN ALREADY EXISTS, RETRY' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateAppointment = async (req, res) => {
  try {
    const payload = { ...req.body };
    const appointmentId = req.params.id;

    const existing = await Appointment.findById(appointmentId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'APPOINTMENT NOT FOUND' });
    }

    payload.appointmentId = existing.appointmentId;

    if (payload.bookingType === 'Slot' && !payload.selectedSlot) {
      return res.status(400).json({ success: false, message: 'SLOT REQUIRED FOR SLOT BOOKING' });
    }

    if (payload.bookingType === 'Walk-in') {
      payload.selectedSlot = '';
    }

    const tokenNumber = Number(payload.tokenNumber);
    if (!Number.isInteger(tokenNumber) || tokenNumber < 1) {
      return res.status(400).json({ success: false, message: 'INVALID TOKEN NUMBER' });
    }
    payload.tokenNumber = tokenNumber;

    if (payload.bookingType === 'Slot') {
      const slotConflict = await Appointment.findOne({
        _id: { $ne: appointmentId },
        doctorId: payload.doctorId,
        appointmentDate: payload.appointmentDate,
        bookingType: 'Slot',
        selectedSlot: payload.selectedSlot
      });

      if (slotConflict) {
        return res.status(409).json({ success: false, message: 'SELECTED SLOT ALREADY BOOKED' });
      }
    }

    const updated = await Appointment.findByIdAndUpdate(
      appointmentId,
      {
        ...payload,
        notes: payload.notes || '',
        patientSearch: payload.patientSearch || '',
        patientName: payload.patientName || '',
        patientMobile: payload.patientMobile || '',
        availableSlotsAtBooking: Array.isArray(payload.availableSlotsAtBooking) ? payload.availableSlotsAtBooking : []
      },
      { new: true, runValidators: true }
    );

    return res.json({ success: true, message: 'APPOINTMENT UPDATED', data: updated });
  } catch (error) {
    if (error?.code === 11000 && error?.keyPattern?.tokenNumber) {
      return res.status(409).json({ success: false, message: 'TOKEN ALREADY EXISTS, RETRY' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: 'APPOINTMENT DELETED' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
