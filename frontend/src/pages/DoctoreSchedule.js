import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
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
  const [monthFilter, setMonthFilter] = useState(String(currentMonth));
  const [yearFilter, setYearFilter] = useState(String(currentYear));
  const [formData, setFormData] = useState(getInitialFormData());

  const yearOptions = useMemo(() => {
    const years = [];
    for (let y = currentYear - 2; y <= currentYear + 5; y += 1) years.push(y);
    return years;
  }, []);

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/doctors/all`);
      if (res.data.success) setDoctors(res.data.data || []);
    } catch (err) {
      toast.error('FAILED TO FETCH DOCTOR LIST');
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/doctor-schedules/all`);
      if (res.data.success) setSchedules(res.data.data || []);
    } catch (err) {
      toast.error('FAILED TO FETCH SCHEDULES');
    }
  };

  useEffect(() => {
    fetchDoctors();
    fetchSchedules();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setFormData(getInitialFormData());
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

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter((d) => d !== day) : [...prev.days, day]
    }));
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setFormData({
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
      const res = await axios.delete(`${API_BASE_URL}/api/doctor-schedules/${item._id}`);
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
        ? await axios.put(`${API_BASE_URL}/api/doctor-schedules/update/${editingId}`, payload)
        : await axios.post(`${API_BASE_URL}/api/doctor-schedules/create`, payload);

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

      const matchMonth = !monthFilter || String(item.month) === monthFilter;
      const matchYear = !yearFilter || String(item.year) === yearFilter;

      return matchSearch && matchMonth && matchYear;
    });
  }, [schedules, searchTerm, monthFilter, yearFilter]);

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="header-card">
          <div className="header-row">
            <div className="header-icon">
              <CalendarDays size={30} />
            </div>
            <div>
              <h1 className="header-title">Doctor Schedule</h1>
              <p className="header-subtitle">Month Wise Schedule Management</p>
            </div>
          </div>

          {!showForm ? (
            <button
              type="button"
              onClick={openAddForm}
              className="btn-primary"
            >
              <Plus size={16} />
              ADD SCHEDULE
            </button>
          ) : (
            <button
              type="button"
              onClick={closeForm}
              className="btn-secondary"
            >
              <ArrowLeft size={16} />
              BACK TO LIST
            </button>
          )}
        </div>
      </header>

      <main className="px-6 pb-12">
        {!showForm ? (
          <div className="card p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-[color:var(--brand-500)]" size={20} />
                <h2 className="card-title">Doctor Schedule List</h2>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by doctor name or ID"
                    className="search-input"
                  />
                </div>
                <select
                  value={monthFilter}
                  onChange={(e) => setMonthFilter(e.target.value)}
                  className="select-field uppercase"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={String(m.value)}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="select-field uppercase"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={String(y)}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredSchedules.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold uppercase">
                {schedules.length === 0 ? 'No schedules saved yet.' : 'No schedule found for this filter.'}
              </div>
            ) : (
              <div className="table-wrap">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[1220px]">
                    <thead>
                      <tr className="table-head sticky top-0 z-10">
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
                        <tr key={item._id} className="table-row">
                          <td className="py-3 px-3 font-bold text-[color:var(--brand-600)]">{item.doctorId}</td>
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
                                className="icon-btn"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="danger-btn"
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
          <form onSubmit={handleSubmit} className="max-w-7xl mx-auto space-y-6">
            <div className="card p-6">
              <h2 className="card-title mb-4">Month Wise Schedule (Fixed)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SelectField label="Month" name="month" value={formData.month} onChange={handleInputChange}>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </SelectField>
                <SelectField label="Year" name="year" value={formData.year} onChange={handleInputChange}>
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8 card p-6 space-y-6">
                <h3 className="card-title">Doctor Availability</h3>

                <SelectField label="Doctor Name" name="doctorId" value={formData.doctorId} onChange={handleInputChange}>
                  <option value="">-- SELECT DOCTOR --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.doctorId}>{doc.doctorId} - {doc.doctorName}</option>
                  ))}
                </SelectField>

                <div>
                  <label className="field-label">Day Selection</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mt-3">
                    {DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleDay(day)}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.days.includes(day)
                            ? 'bg-[color:var(--brand-500)] text-white border-[color:var(--brand-500)]'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-[color:var(--brand-500)]'
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

              <div className="lg:col-span-4 space-y-6">
                <div className="card p-6">
                  <label className="field-label block mb-3">Booking Mode</label>
                  <div className="space-y-2">
                    {['Slot Based', 'FCFS', 'Hybrid'].map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, bookingMode: mode }))}
                        className={`w-full py-3 rounded-xl text-sm font-bold border transition-all ${
                          formData.bookingMode === mode
                            ? 'bg-[color:var(--brand-500)] text-white border-[color:var(--brand-500)]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-[color:var(--brand-500)]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[28px] p-6 shadow-xl text-white">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-primary justify-center active:scale-95 disabled:opacity-50"
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
    <label className="field-label">{label}</label>
    <input
      required={required}
      {...props}
      className="input-field"
    />
  </div>
);

const SelectField = ({ label, children, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="field-label">{label}</label>
    <select
      required
      {...props}
      className="select-field uppercase"
    >
      {children}
    </select>
  </div>
);

export default DoctoreSchedule;
