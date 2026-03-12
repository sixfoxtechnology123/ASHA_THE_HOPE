import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '../config/api';
import { CalendarDays, Plus, ArrowLeft, Save, Loader2, Search, Edit, Trash2, List } from 'lucide-react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const currentDate = new Date();
const currentMonth = currentDate.getMonth() + 1;
const currentYear = currentDate.getFullYear();

const getInitialFormData = () => ({
  scheduleId: '',
  doctorId: '',
  doctorName: '',
  month: currentMonth,
  year: currentYear,
  days: [],
  startTime: '',
  endTime: '',
  slotDuration: '',
  breakStartTime: '',
  breakEndTime: '',
  bookingMode: 'Slot Based',
  maxPatientsPerDay: ''
});

const DoctoreSchedule = () => {
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
  const [formData, setFormData] = useState(getInitialFormData());

  const fetchDoctors = async () => {
    try {
      const res = await api.get(`/doctors/all`);
      if (res.data.success) setDoctors(res.data.data || []);
    } catch (err) {
      toast.error('FAILED TO FETCH DOCTOR LIST');
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get(`/doctor-schedules/all`);
      if (res.data.success) setSchedules(res.data.data || []);
    } catch (err) {
      toast.error('FAILED TO FETCH SCHEDULES');
    }
  };

  const fetchNextScheduleId = async () => {
    try {
      const res = await api.get(`/doctor-schedules/next-id`);
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, scheduleId: res.data.nextId }));
      }
    } catch (err) {
      toast.error('FAILED TO GENERATE SCHEDULE ID');
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchSchedules();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(getInitialFormData());
    fetchNextScheduleId();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(getInitialFormData());
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'doctorId') {
      const selectedDoctor = doctors.find((doc) => doc.doctorId === value);
      setFormData((prev) => ({
        ...prev,
        doctorId: selectedDoctor?.doctorId || '',
        doctorName: selectedDoctor?.doctorName || ''
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMonthFilterChange = (e) => {
    setMonthFilter(e.target.value);
  };

  const handleFormMonthChange = (e) => {
    const value = e.target.value;
    if (!value) {
      setFormData((prev) => ({ ...prev, month: '', year: '' }));
      return;
    }
    const [yearStr, monthStr] = value.split('-');
    const parsedMonth = Number(monthStr);
    const parsedYear = Number(yearStr);
    setFormData((prev) => ({
      ...prev,
      month: Number.isNaN(parsedMonth) ? prev.month : parsedMonth,
      year: Number.isNaN(parsedYear) ? prev.year : parsedYear
    }));
  };

  const formatMonthValue = (month, year) => {
    if (!month || !year) return '';
    return `${year}-${String(month).padStart(2, '0')}`;
  };

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day]
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
      scheduleId: item.scheduleId || '',
      doctorId: item.doctorId || '',
      doctorName: item.doctorName || '',
      month: item.month || currentMonth,
      year: item.year || currentYear,
      days: item.days || [],
      startTime: item.startTime || '',
      endTime: item.endTime || '',
      slotDuration: item.slotDuration || '',
      breakStartTime: item.breakStartTime || '',
      breakEndTime: item.breakEndTime || '',
      bookingMode: item.bookingMode || 'Slot Based',
      maxPatientsPerDay: item.maxPatientsPerDay || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (item) => {
    const ok = window.confirm(`Delete schedule for ${item.doctorName} (${item.doctorId})?`);
    if (!ok) return;
    try {
      const res = await api.delete(`/doctor-schedules/${item._id}`);
      if (res.data.success) {
        toast.success('SCHEDULE DELETED');
        fetchSchedules();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'DELETE FAILED');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.doctorId || !formData.doctorName) return toast.error('PLEASE SELECT DOCTOR');
    if (!formData.month || !formData.year) return toast.error('PLEASE SELECT MONTH & YEAR');
    if (!formData.days.length) return toast.error('PLEASE SELECT AT LEAST ONE DAY');

    setLoading(true);
    try {
      const payload = {
        ...formData,
        month: Number(formData.month),
        year: Number(formData.year),
        slotDuration: Number(formData.slotDuration),
        maxPatientsPerDay: formData.maxPatientsPerDay === '' ? '' : Number(formData.maxPatientsPerDay)
      };

      const res = editingId
        ? await api.put(`/doctor-schedules/update/${editingId}`, payload)
        : await api.post(`/doctor-schedules/create`, payload);

      if (res.data.success) {
        toast.success(editingId ? 'SCHEDULE UPDATED' : 'SCHEDULE SAVED');
        closeForm();
        fetchSchedules();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (editingId ? 'UPDATE FAILED' : 'SAVE FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return schedules.filter((item) => {
      const matchSearch =
        !query ||
        (item.doctorName || '').toLowerCase().includes(query) ||
        (item.doctorId || '').toLowerCase().includes(query);

      const matchMonth = !monthFilter || `${item.year}-${String(item.month).padStart(2, '0')}` === monthFilter;

      return matchSearch && matchMonth;
    });
  }, [schedules, searchTerm, monthFilter]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-semibold">
      <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border-b-4 border-emerald-500 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(14,165,164,0.6)]">
              <CalendarDays size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Doctor Schedule</h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">Month Wise Schedule Management</p>
            </div>
          </div>

          {!showForm ? (
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600"
            >
              <Plus size={16} />
              ADD SCHEDULE
            </button>
          ) : (
            <button
              type="button"
              onClick={closeForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white"
            >
              <ArrowLeft size={16} />
              BACK TO LIST
            </button>
          )}
        </div>
      </header>

      <main className="px-6 pb-12">
        {!showForm ? (
          <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-emerald-500" size={20} />
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Doctor Schedule List</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by doctor name or ID"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 pl-10 text-[11px] font-bold uppercase tracking-wide outline-none focus:border-emerald-500"
                  />
                </div>
                <input
                  type="month"
                  value={monthFilter}
                  onChange={handleMonthFilterChange}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {filteredSchedules.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold uppercase">
                {schedules.length === 0 ? 'No schedules saved yet.' : 'No schedule found for this filter.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[1220px]">
                    <thead>
                      <tr className="sticky top-0 z-10 bg-white text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">
                        <th className="py-3 px-3">Schedule ID</th>
                        <th className="py-3 px-3">Doctor ID</th>
                        <th className="py-3 px-3">Doctor Name</th>
                        <th className="py-3 px-3">Month-Year</th>
                        <th className="py-3 px-3">Days</th>
                        <th className="py-3 px-3">Time</th>
                        <th className="py-3 px-3">Slot</th>
                        <th className="py-3 px-3">Break</th>
                        <th className="py-3 px-3">Mode</th>
                        <th className="py-3 px-3">Max Patients</th>
                        <th className="py-3 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchedules.map((item) => (
                        <tr key={item._id} className="border-b border-slate-100 text-[13px] font-bold text-slate-600">
                          <td className="py-3 px-3 font-bold text-emerald-600">{item.scheduleId || '-'}</td>
                          <td className="py-3 px-3 font-bold text-emerald-600">{item.doctorId}</td>
                          <td className="py-3 px-3">{item.doctorName}</td>
                          <td className="py-3 px-3">{MONTHS.find((m) => m.value === Number(item.month))?.label} {item.year}</td>
                          <td className="py-3 px-3">{(item.days || []).join(', ')}</td>
                          <td className="py-3 px-3">{item.startTime} - {item.endTime}</td>
                          <td className="py-3 px-3">{item.slotDuration} min</td>
                          <td className="py-3 px-3">{item.breakStartTime && item.breakEndTime ? `${item.breakStartTime} - ${item.breakEndTime}` : '-'}</td>
                          <td className="py-3 px-3">{item.bookingMode}</td>
                          <td className="py-3 px-3">{item.maxPatientsPerDay || '-'}</td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(item)}
                                className="rounded-xl bg-slate-100 p-2 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="rounded-xl bg-rose-100 p-2 text-rose-600 transition hover:bg-rose-600 hover:text-white"
                                title="Delete"
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
          <form onSubmit={handleSubmit} className="mx-auto max-w-7xl space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
              <h2 className="mb-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Month Wise Schedule (Fixed)</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <InputField label="Schedule ID" name="scheduleId" value={formData.scheduleId} onChange={handleInputChange} readOnly />
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Month &amp; Year</label>
                  <input
                    type="month"
                    value={formatMonthValue(formData.month, formData.year)}
                    onChange={handleFormMonthChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] lg:col-span-8 space-y-6">
                <h3 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Doctor Availability</h3>

                <SelectField label="Doctor Name" name="doctorId" value={formData.doctorId} onChange={handleInputChange}>
                  <option value="">-- SELECT DOCTOR --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.doctorId}>{doc.doctorId} - {doc.doctorName}</option>
                  ))}
                </SelectField>

                <div>
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Day Selection</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.days.includes(day)
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Start Time" type="time" name="startTime" value={formData.startTime} onChange={handleInputChange} />
                  <InputField label="End Time" type="time" name="endTime" value={formData.endTime} onChange={handleInputChange} />
                  <InputField label="Slot Duration (Minutes)" type="number" min="1" name="slotDuration" value={formData.slotDuration} onChange={handleInputChange} />
                  <InputField label="Max Patients per Day (Optional)" type="number" min="1" name="maxPatientsPerDay" value={formData.maxPatientsPerDay} onChange={handleInputChange} required={false} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField label="Break Start Time" type="time" name="breakStartTime" value={formData.breakStartTime} onChange={handleInputChange} required={false} />
                  <InputField label="Break End Time" type="time" name="breakEndTime" value={formData.breakEndTime} onChange={handleInputChange} required={false} />
                </div>
              </div>

              <div className="space-y-6 lg:col-span-4">
                <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
                  <label className="mb-3 block text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Booking Mode</label>
                  <div className="space-y-2">
                    {['Slot Based', 'FCFS', 'Hybrid'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, bookingMode: mode }))}
                        className={`w-full py-3 rounded-xl text-sm font-bold border transition-all ${
                          formData.bookingMode === mode
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-500'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] bg-slate-900 p-6 text-white shadow-xl">
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {editingId ? 'UPDATE SCHEDULE' : 'SAVE SCHEDULE'}
                  </button>
                </div>
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
    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">{label}</label>
    <input
      required={required}
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
    />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">{label}</label>
    <select
      required
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
    >
      {children}
    </select>
  </div>
);

export default DoctoreSchedule;
