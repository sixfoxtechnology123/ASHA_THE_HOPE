import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { CalendarDays, Save, Loader2, Search, User, Plus, ArrowLeft, List, Edit, Trash2 } from 'lucide-react';

const getInitialFormData = () => ({
  patientSearch: '',
  patientName: '',
  patientMobile: '',
  department: '',
  doctorId: '',
  doctorName: '',
  appointmentDate: '',
  selectedSlot: '',
  bookingType: 'Slot',
  tokenAutoGenerate: 'Yes',
  manualToken: '',
  paymentStatus: 'Unpaid',
  notes: ''
});

const formatDate = (value) => {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleDateString();
};

const toLocalYmd = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const dayShort = (dateObj) => dateObj.toLocaleDateString('en-US', { weekday: 'short' });

const parseTimeToMinutes = (value) => {
  const [h, m] = String(value || '').split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
};

const toTimeString = (mins) => {
  const hh = String(Math.floor(mins / 60)).padStart(2, '0');
  const mm = String(mins % 60).padStart(2, '0');
  return `${hh}:${mm}`;
};

const generateSlotsFromSchedule = (schedule) => {
  if (!schedule) return [];

  const startTime = parseTimeToMinutes(schedule.startTime);
  const endTime = parseTimeToMinutes(schedule.endTime);
  const slotDuration = Number(schedule.slotDuration || 0);
  const breakStart = parseTimeToMinutes(schedule.breakStartTime);
  const breakEnd = parseTimeToMinutes(schedule.breakEndTime);

  if (!Number.isInteger(startTime) || !Number.isInteger(endTime) || slotDuration <= 0 || endTime <= startTime) {
    return [];
  }

  const overlapsBreak = (start, end) => (
    Number.isInteger(breakStart) &&
    Number.isInteger(breakEnd) &&
    start < breakEnd &&
    end > breakStart
  );

  const slots = [];
  for (let cursor = startTime; cursor + slotDuration <= endTime; cursor += slotDuration) {
    const slotEnd = cursor + slotDuration;
    if (!overlapsBreak(cursor, slotEnd)) {
      slots.push(`${toTimeString(cursor)} - ${toTimeString(slotEnd)}`);
    }
  }
  return slots;
};

const AppointmentBooking = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [nextToken, setNextToken] = useState(1);
  const [showAddPatient, setShowAddPatient] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(getInitialFormData());
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const isEditMode = Boolean(editingAppointmentId);

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, doctorRes, scheduleRes, appointmentRes, tokenRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/master/department/all`),
        axios.get(`${API_BASE_URL}/api/doctors/all`),
        axios.get(`${API_BASE_URL}/api/doctor-schedules/all`),
        axios.get(`${API_BASE_URL}/api/appointments/all`),
        axios.get(`${API_BASE_URL}/api/appointments/next-token`)
      ]);

      if (deptRes.data.success) setDepartments(deptRes.data.data || []);
      if (doctorRes.data.success) setDoctors(doctorRes.data.data || []);
      if (scheduleRes.data.success) setSchedules(scheduleRes.data.data || []);
      if (appointmentRes.data.success) setAppointments(appointmentRes.data.data || []);
      if (tokenRes.data.success) setNextToken(Number(tokenRes.data.nextToken || 1));
    } catch (err) {
      toast.error('FAILED TO LOAD APPOINTMENT DATA');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openForm = () => {
    setFormData(getInitialFormData());
    setShowAddPatient(false);
    setEditingAppointmentId(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormData(getInitialFormData());
    setShowAddPatient(false);
    setEditingAppointmentId(null);
  };

  const filteredDoctors = useMemo(() => {
    if (!formData.department) return doctors;
    return doctors.filter((doc) => doc.department === formData.department);
  }, [doctors, formData.department]);

  const selectedMonthInfo = useMemo(() => {
    const now = new Date();
    return { month: now.getMonth() + 1, year: now.getFullYear(), todayYmd: toLocalYmd(now) };
  }, []);

  const doctorMonthSchedules = useMemo(() => {
    if (!formData.doctorId) return [];
    return schedules.filter(
      (item) =>
        item.doctorId === formData.doctorId &&
        Number(item.month) === selectedMonthInfo.month &&
        Number(item.year) === selectedMonthInfo.year
    );
  }, [schedules, formData.doctorId, selectedMonthInfo.month, selectedMonthInfo.year]);

  const getScheduleForDate = (dateStr) => {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return null;
    const short = dayShort(d);
    return doctorMonthSchedules.find((item) => Array.isArray(item.days) && item.days.includes(short)) || null;
  };

  const selectedDateSchedule = useMemo(() => {
    if (!formData.appointmentDate || !formData.doctorId) return null;
    return getScheduleForDate(formData.appointmentDate);
  }, [formData.appointmentDate, formData.doctorId, doctorMonthSchedules]);

  const allSlotsForSelectedDate = useMemo(() => generateSlotsFromSchedule(selectedDateSchedule), [selectedDateSchedule]);

  const bookedSlotsForSelectedDate = useMemo(() => {
    if (!formData.doctorId || !formData.appointmentDate) return [];
    return appointments
      .filter(
        (item) =>
          item._id !== editingAppointmentId &&
          item.doctorId === formData.doctorId &&
          item.appointmentDate === formData.appointmentDate &&
          item.bookingType === 'Slot' &&
          item.selectedSlot
      )
      .map((item) => item.selectedSlot);
  }, [appointments, editingAppointmentId, formData.doctorId, formData.appointmentDate]);

  const availableSlots = useMemo(
    () => allSlotsForSelectedDate.filter((slot) => !bookedSlotsForSelectedDate.includes(slot)),
    [allSlotsForSelectedDate, bookedSlotsForSelectedDate]
  );

  const slotOptions = useMemo(
    () =>
      allSlotsForSelectedDate.map((slot) => ({
        slot,
        disabled: bookedSlotsForSelectedDate.includes(slot)
      })),
    [allSlotsForSelectedDate, bookedSlotsForSelectedDate]
  );

  useEffect(() => {
    if (formData.selectedSlot && !availableSlots.includes(formData.selectedSlot)) {
      setFormData((prev) => ({ ...prev, selectedSlot: '' }));
    }
  }, [availableSlots, formData.selectedSlot]);

  const monthDateCards = useMemo(() => {
    if (!formData.doctorId) return [];

    const { month, year, todayYmd } = selectedMonthInfo;
    const daysInMonth = new Date(year, month, 0).getDate();
    const cards = [];

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateObj = new Date(year, month - 1, day);
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const schedule = getScheduleForDate(dateStr);
      const slots = generateSlotsFromSchedule(schedule);
      const bookedCount = appointments.filter(
        (item) =>
          item._id !== editingAppointmentId &&
          item.doctorId === formData.doctorId &&
          item.appointmentDate === dateStr &&
          item.bookingType === 'Slot' &&
          item.selectedSlot
      ).length;

      const hasSchedule = Boolean(schedule);
      const total = slots.length;
      const free = Math.max(total - bookedCount, 0);
      const isPastDate = dateStr < todayYmd;
      const enabled = !isPastDate && hasSchedule && free > 0;
      const status = isPastDate ? 'Past' : !hasSchedule ? 'No Schedule' : free > 0 ? 'Available' : 'Full';

      cards.push({
        dateStr,
        label: `${String(day).padStart(2, '0')} ${dayShort(dateObj)}`,
        enabled,
        total,
        free,
        status
      });
    }

    return cards;
  }, [appointments, editingAppointmentId, formData.doctorId, doctorMonthSchedules, selectedMonthInfo.month, selectedMonthInfo.year, selectedMonthInfo.todayYmd]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'department') {
      setFormData((prev) => ({
        ...prev,
        department: value,
        doctorId: '',
        doctorName: '',
        appointmentDate: '',
        selectedSlot: ''
      }));
      return;
    }

    if (name === 'doctorId') {
      const selectedDoctor = doctors.find((doc) => doc.doctorId === value);
      setFormData((prev) => ({
        ...prev,
        doctorId: selectedDoctor?.doctorId || '',
        doctorName: selectedDoctor?.doctorName || '',
        appointmentDate: '',
        selectedSlot: ''
      }));
      return;
    }

    if (name === 'bookingType' && value === 'Walk-in') {
      setFormData((prev) => ({ ...prev, bookingType: value, selectedSlot: '' }));
      return;
    }

    if (name === 'appointmentDate' && value && value < selectedMonthInfo.todayYmd) {
      toast.error('PAST DATES ARE DISABLED');
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateCardClick = (dateStr, enabled) => {
    if (!enabled) return;
    setFormData((prev) => ({
      ...prev,
      appointmentDate: dateStr,
      selectedSlot: ''
    }));
  };

  const handleEditAppointment = (item) => {
    setEditingAppointmentId(item._id);
    setShowAddPatient(Boolean(item.patientName || item.patientMobile));
    setFormData({
      patientSearch: item.patientSearch || '',
      patientName: item.patientName || '',
      patientMobile: item.patientMobile || '',
      department: item.department || '',
      doctorId: item.doctorId || '',
      doctorName: item.doctorName || '',
      appointmentDate: item.appointmentDate || '',
      selectedSlot: item.selectedSlot || '',
      bookingType: item.bookingType || 'Slot',
      tokenAutoGenerate: 'No',
      manualToken: String(item.tokenNumber || ''),
      paymentStatus: item.paymentStatus || 'Unpaid',
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleDeleteAppointment = async (item) => {
    const confirmed = window.confirm(`Delete token ${item.tokenNumber} appointment?`);
    if (!confirmed) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/appointments/${item._id}`);
      if (res.data.success) {
        toast.success('APPOINTMENT DELETED');
        await loadData();
      } else {
        toast.error('FAILED TO DELETE APPOINTMENT');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'DELETE FAILED');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.department) return toast.error('PLEASE SELECT DEPARTMENT');
    if (!formData.doctorId) return toast.error('PLEASE SELECT DOCTOR');
    if (!formData.appointmentDate) return toast.error('PLEASE SELECT APPOINTMENT DATE');
    if (formData.bookingType === 'Slot' && !formData.selectedSlot) return toast.error('PLEASE SELECT SLOT');
    if ((isEditMode || formData.tokenAutoGenerate === 'No') && !formData.manualToken.trim()) return toast.error('ENTER TOKEN NUMBER');

    const payload = {
      patientSearch: formData.patientSearch,
      patientName: showAddPatient ? formData.patientName : '',
      patientMobile: showAddPatient ? formData.patientMobile : '',
      department: formData.department,
      doctorId: formData.doctorId,
      doctorName: formData.doctorName,
      appointmentDate: formData.appointmentDate,
      selectedSlot: formData.bookingType === 'Slot' ? formData.selectedSlot : '',
      availableSlotsAtBooking: availableSlots,
      bookingType: formData.bookingType,
      tokenAutoGenerate: formData.tokenAutoGenerate,
      tokenNumber: isEditMode || formData.tokenAutoGenerate === 'No' ? Number(formData.manualToken) : nextToken,
      paymentStatus: formData.paymentStatus,
      notes: formData.notes
    };

    setSaving(true);
    try {
      const res = isEditMode
        ? await axios.put(`${API_BASE_URL}/api/appointments/update/${editingAppointmentId}`, payload)
        : await axios.post(`${API_BASE_URL}/api/appointments/create`, payload);
      if (res.data.success) {
        toast.success(isEditMode ? `APPOINTMENT UPDATED | TOKEN ${res.data.data.tokenNumber}` : `APPOINTMENT SAVED | TOKEN ${res.data.data.tokenNumber}`);
        closeForm();
        await loadData();
      } else {
        toast.error(isEditMode ? 'FAILED TO UPDATE APPOINTMENT' : 'FAILED TO SAVE APPOINTMENT');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isEditMode ? 'UPDATE FAILED' : 'SAVE FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const filteredAppointments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter((item) =>
      [
        item.patientName,
        item.patientMobile,
        item.patientSearch,
        item.doctorName,
        item.doctorId,
        String(item.tokenNumber),
        item.appointmentDate
      ]
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [appointments, searchTerm]);

  return (
    <div className="min-h-screen bg-sky-50 font-sans font-semibold">
      <header className="p-6 sticky top-0 z-20 bg-sky-50/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-[24px] shadow-sm border-b-4 border-sky-400">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-sky-200">
              <CalendarDays size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Appointment Booking</h1>
              <p className="text-sm text-sky-600 font-semibold uppercase tracking-widest mt-0.5">List + Slot Booking Form</p>
            </div>
          </div>

          {!showForm ? (
            <button
              type="button"
              onClick={openForm}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              ADD APPOINTMENT
            </button>
          ) : (
            <button
              type="button"
              onClick={closeForm}
              className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              BACK TO LIST
            </button>
          )}
        </div>
      </header>

      <main className="px-6 pb-12">
        {!showForm ? (
          <div className="max-w-7xl mx-auto bg-white rounded-[32px] p-8 shadow-md border border-sky-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 border-b border-sky-50 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-sky-500" size={20} />
                <h2 className="text-sm font-bold text-black uppercase tracking-[0.1em]">Appointment Booking List</h2>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by patient/doctor/token/date"
                  className="w-full py-2.5 pl-10 pr-4 border border-sky-100 rounded-xl outline-none focus:border-sky-500 text-sm font-semibold uppercase"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-sky-500" />
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold uppercase">No appointments found.</div>
            ) : (
              <div className="border border-sky-100 rounded-2xl overflow-hidden">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[1300px]">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-sky-600 border-b border-sky-100 bg-white sticky top-0 z-10">
                        <th className="py-3 px-3">Token</th>
                        <th className="py-3 px-3">Patient</th>
                        <th className="py-3 px-3">Mobile</th>
                        <th className="py-3 px-3">Department</th>
                        <th className="py-3 px-3">Doctor</th>
                        <th className="py-3 px-3">Date</th>
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Slot</th>
                        <th className="py-3 px-3">Payment</th>
                        <th className="py-3 px-3">Notes</th>
                        <th className="py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAppointments.map((item) => (
                        <tr key={item._id} className="border-b border-sky-50 text-sm text-slate-700 font-semibold">
                          <td className="py-3 px-3 font-bold text-sky-700">{item.tokenNumber}</td>
                          <td className="py-3 px-3">{item.patientName || item.patientSearch || '-'}</td>
                          <td className="py-3 px-3">{item.patientMobile || '-'}</td>
                          <td className="py-3 px-3">{item.department}</td>
                          <td className="py-3 px-3">{item.doctorName}</td>
                          <td className="py-3 px-3">{formatDate(item.appointmentDate)}</td>
                          <td className="py-3 px-3">{item.bookingType}</td>
                          <td className="py-3 px-3">{item.selectedSlot || '-'}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-1 rounded-lg text-xs font-bold ${item.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {item.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3">{item.notes || '-'}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditAppointment(item)}
                                className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all"
                                title="Edit appointment"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAppointment(item)}
                                className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                title="Delete appointment"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-full max-w-none mx-auto">
            <div className="bg-white rounded-[28px] p-6 border border-sky-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-sky-50 pb-3">
                <User className="text-sky-500" size={20} />
                <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-black">Patient Search / Add New</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={16} />
                  <input
                    type="text"
                    name="patientSearch"
                    value={formData.patientSearch}
                    onChange={handleChange}
                    placeholder="SEARCH BY NAME / UHID / MOBILE"
                    className="w-full py-2.5 pl-10 pr-4 border border-sky-100 rounded-xl outline-none focus:border-sky-500 text-sm font-semibold uppercase"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPatient((prev) => !prev)}
                  className={`py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    showAddPatient ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-700 border-sky-100 hover:border-sky-500'
                  }`}
                >
                  {showAddPatient ? 'CLOSE NEW PATIENT' : 'ADD NEW PATIENT'}
                </button>
              </div>

              {showAddPatient && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InputField label="Patient Name" name="patientName" value={formData.patientName} onChange={handleChange} />
                  <InputField label="Patient Mobile" name="patientMobile" value={formData.patientMobile} onChange={handleChange} />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <SelectField label="Department" name="department" value={formData.department} onChange={handleChange}>
                  <option value="">-- SELECT DEPARTMENT --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.deptName}>{dept.deptName}</option>
                  ))}
                </SelectField>

                <SelectField label="Doctor" name="doctorId" value={formData.doctorId} onChange={handleChange}>
                  <option value="">-- SELECT DOCTOR --</option>
                  {filteredDoctors.map((doc) => (
                    <option key={doc._id} value={doc.doctorId}>{doc.doctorName}</option>
                  ))}
                </SelectField>
              </div>

              {formData.doctorId && (
                <div className="space-y-3">
                  <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">
                    This Month Date Slot Status (Green = Enable, Red/Gray = Disable)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {monthDateCards.map((card) => {
                      const isSelected = formData.appointmentDate === card.dateStr;
                      const stateClass = !card.enabled
                        ? card.status === 'Full'
                          ? 'bg-rose-100 text-rose-700 border-rose-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                        : 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200';

                      return (
                        <button
                          key={card.dateStr}
                          type="button"
                          onClick={() => handleDateCardClick(card.dateStr, card.enabled)}
                          className={`border rounded-xl p-2 text-left transition-all ${stateClass} ${isSelected ? 'ring-2 ring-sky-500' : ''}`}
                          disabled={!card.enabled}
                        >
                          <div className="text-xs font-bold">{card.label}</div>
                          <div className="text-[10px] font-semibold">{card.status}</div>
                          <div className="text-[10px] font-semibold">Free {card.free}/{card.total}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  label="Appointment Date"
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleChange}
                  min={isEditMode ? undefined : selectedMonthInfo.todayYmd}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">Slots (Booked are disabled)</label>
                  <select
                    name="selectedSlot"
                    value={formData.selectedSlot}
                    onChange={handleChange}
                    disabled={formData.bookingType === 'Walk-in'}
                    className="w-full py-2.5 px-3 border border-sky-100 rounded-xl font-semibold text-xs text-slate-700 outline-none focus:border-sky-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 uppercase"
                  >
                    <option value="">
                      {formData.appointmentDate
                        ? slotOptions.length ? '-- SELECT SLOT --' : '-- NO SLOT AVAILABLE --'
                        : '-- SELECT DATE FIRST --'}
                    </option>
                    {slotOptions.map(({ slot, disabled }) => (
                      <option key={slot} value={slot} disabled={disabled}>
                        {slot}{disabled ? ' (BOOKED)' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ChoiceField
                  label="Booking Type"
                  name="bookingType"
                  value={formData.bookingType}
                  onChange={handleChange}
                  options={['Slot', 'Walk-in']}
                />
                <ChoiceField
                  label="Token Auto Generate"
                  name="tokenAutoGenerate"
                  value={formData.tokenAutoGenerate}
                  onChange={handleChange}
                  options={['Yes', 'No']}
                  disabled={isEditMode}
                />
                <ChoiceField
                  label="Payment Status"
                  name="paymentStatus"
                  value={formData.paymentStatus}
                  onChange={handleChange}
                  options={['Paid', 'Unpaid']}
                />
                <InputField
                  label="Token Number"
                  name="manualToken"
                  value={formData.tokenAutoGenerate === 'Yes' ? String(nextToken) : formData.manualToken}
                  onChange={handleChange}
                  required={formData.tokenAutoGenerate === 'No'}
                  disabled={formData.tokenAutoGenerate === 'Yes'}
                  placeholder={formData.tokenAutoGenerate === 'Yes' ? 'AUTO GENERATED' : 'ENTER TOKEN NUMBER'}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={4}
                  className="w-full py-2.5 px-3 border border-sky-100 rounded-xl font-semibold text-slate-700 outline-none focus:border-sky-500 bg-white uppercase"
                  placeholder="OPTIONAL NOTES"
                />
              </div>

              <div className="sticky bottom-0 bg-slate-900 rounded-[28px] p-2 shadow-xl text-white">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-1 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin" /> : <Save size={10} />}
                  {isEditMode ? 'UPDATE APPOINTMENT' : 'SAVE APPOINTMENT'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

const InputField = ({ label, required = true, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">{label}</label>
    <input
      required={required}
      {...props}
      className="w-full py-2.5 px-3 border border-sky-100 rounded-xl font-semibold text-slate-700 outline-none focus:border-sky-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 uppercase placeholder:normal-case"
    />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">{label}</label>
    <select
      required
      {...props}
      className="w-full py-2.5 px-3 border border-sky-100 rounded-xl font-semibold text-xs text-slate-700 outline-none focus:border-sky-500 bg-white uppercase"
    >
      {children}
    </select>
  </div>
);

const ChoiceField = ({ label, name, value, onChange, options, disabled = false }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">{label}</label>
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange({ target: { name, value: opt } })}
          className={`py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            value === opt ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-700 border-sky-100 hover:border-sky-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

export default AppointmentBooking;
