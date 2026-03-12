import React, { useState, useEffect } from 'react';
import { api } from '../config/api';
import { Stethoscope, Save, ShieldCheck, Loader2, User, CreditCard, List, Plus, ArrowLeft, Edit, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const getInitialFormData = () => ({
  doctorId: '',
  doctorName: '',
  qualification: '',
  specialization: '',
  registrationNumber: '',
  mobile: '',
  email: '',
  department: '',
  consultationFee: '',
  revenueShareType: 'Percentage',
  doctorShare: '',
  centerShare: '',
  status: 'Active',
  joiningDate: new Date().toISOString().split('T')[0]
});

const DoctorRegistration = () => {
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(getInitialFormData());

  const fetchDoctors = async () => {
    try {
      const doctorRes = await api.get(`/doctors/all`);
      if (doctorRes.data.success) setDoctors(doctorRes.data.data || []);
    } catch (err) {
      console.error('Doctor List Error:', err);
      toast.error('FAILED TO FETCH DOCTOR LIST');
    }
  };

  const fetchInitialData = async () => {
    try {
      const [deptRes, idRes] = await Promise.all([
        api.get(`/master/department/all`),
        api.get(`/doctors/latest-id`)
      ]);

      if (deptRes.data.success) setDepartments(deptRes.data.data);
      if (idRes.data.success) {
        setFormData(prev => ({ ...prev, doctorId: idRes.data.nextId }));
      }
    } catch (err) {
      console.error('Sync Error:', err);
      toast.error('FAILED TO SYNC WITH SERVER');
    }
  };

  useEffect(() => {
    fetchInitialData();
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (formData.revenueShareType === 'Percentage' && formData.doctorShare) {
      const dShare = parseFloat(formData.doctorShare);
      if (dShare <= 100) {
        setFormData(prev => ({ ...prev, centerShare: (100 - dShare).toString() }));
      }
    } else if (formData.revenueShareType === 'Fixed') {
      setFormData(prev => ({ ...prev, centerShare: '' }));
    }
  }, [formData.doctorShare, formData.revenueShareType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'email') {
      formattedValue = value.toLowerCase();
    } else if (name === 'status' || name === 'revenueShareType') {
      formattedValue = value;
    } else if (['doctorName', 'qualification', 'specialization', 'registrationNumber', 'mobile', 'department'].includes(name)) {
      formattedValue = value.toUpperCase();
    }

    setFormData({ ...formData, [name]: formattedValue });
  };

  const openAddForm = async () => {
    try {
      const idRes = await api.get(`/doctors/latest-id`);
      const latestId = idRes.data?.success ? idRes.data.nextId : '';
      setFormData({ ...getInitialFormData(), doctorId: latestId });
    } catch (err) {
      setFormData(getInitialFormData());
    }
    setEditingDoctorId(null);
    setShowForm(true);
  };

  const closeAddForm = async () => {
    setShowForm(false);
    setEditingDoctorId(null);
    setFormData(getInitialFormData());
    await fetchInitialData();
  };

  const handleEdit = (doctor) => {
    setEditingDoctorId(doctor._id);
    setFormData({
      doctorId: doctor.doctorId || '',
      doctorName: doctor.doctorName || '',
      qualification: doctor.qualification || '',
      specialization: doctor.specialization || '',
      registrationNumber: doctor.registrationNumber || '',
      mobile: doctor.mobile || '',
      email: doctor.email || '',
      department: doctor.department || '',
      consultationFee: doctor.consultationFee ?? '',
      revenueShareType: doctor.revenueShareType || 'Percentage',
      doctorShare: doctor.doctorShare ?? '',
      centerShare: doctor.centerShare ?? '',
      status: doctor.status || 'Active',
      joiningDate: doctor.joiningDate ? new Date(doctor.joiningDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    });
    setShowForm(true);
  };

  const handleDelete = async (doctor) => {
    const confirmed = window.confirm(`Delete ${doctor.doctorName} (${doctor.doctorId})?`);
    if (!confirmed) return;
    try {
      const res = await api.delete(`/doctors/${doctor._id}`);
      if (res.data.success) {
        toast.success('DOCTOR DELETED SUCCESSFULLY!');
        await fetchDoctors();
        await fetchInitialData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'DELETE FAILED');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.department) return toast.error('PLEASE SELECT A DEPARTMENT');

    setLoading(true);
    try {
      const res = editingDoctorId
        ? await api.put(`/doctors/update/${editingDoctorId}`, formData)
        : await api.post(`/doctors/register`, formData);
      if (res.data.success) {
        toast.success(editingDoctorId ? 'DOCTOR UPDATED SUCCESSFULLY!' : 'DOCTOR REGISTERED SUCCESSFULLY!');
        await fetchDoctors();
        await fetchInitialData();
        setShowForm(false);
        setEditingDoctorId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (editingDoctorId ? 'UPDATE FAILED' : 'REGISTRATION FAILED'));
    } finally {
      setLoading(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return true;
    return (
      (doctor.doctorName || '').toLowerCase().includes(q) ||
      (doctor.doctorId || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-semibold">
      <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border-b-4 border-emerald-500 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(14,165,164,0.6)]">
              <Stethoscope size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Doctor Onboarding</h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">Asha Hope Medical Records</p>
            </div>
          </div>

          {showForm ? (
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white">
              <ShieldCheck size={18} className="text-white/80" />
              ID: {formData.doctorId || 'SYNCING...'}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600"
            >
              <Plus size={16} />
              ADD DOCTOR
            </button>
          )}
        </div>
      </header>
      <main className="px-6 pb-12">
        {!showForm ? (
          <div className="mx-auto max-w-7xl rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-emerald-500" size={20} />
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Registered Doctors List</h2>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Doctor Name or ID"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 pl-10 text-[11px] font-bold uppercase tracking-wide outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-semibold uppercase">
                {doctors.length === 0 ? 'No doctors registered yet.' : 'No doctor found for this search.'}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <div className="max-h-[540px] overflow-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="sticky top-0 z-10 bg-white text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">
                      <th className="py-3">Doctor ID</th>
                      <th className="py-3">Name</th>
                      <th className="py-3">Department</th>
                      <th className="py-3">Specialization</th>
                      <th className="py-3">Mobile</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Joining Date</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map((doctor) => (
                      <tr key={doctor._id} className="border-b border-slate-100 text-[13px] font-bold text-slate-600">
                        <td className="py-3 font-semibold text-emerald-600">{doctor.doctorId}</td>
                        <td className="py-3 font-semibold">{doctor.doctorName}</td>
                        <td className="py-3 font-semibold">{doctor.department}</td>
                        <td className="py-3 font-semibold">{doctor.specialization}</td>
                        <td className="py-3 font-semibold">{doctor.mobile}</td>
                        <td className="py-3">
                          <span className={doctor.status === 'Active' ? 'rounded-md bg-emerald-100 px-2 py-1 text-[10px] font-extrabold text-emerald-600' : 'rounded-md bg-rose-100 px-2 py-1 text-[10px] font-extrabold text-rose-600'}>
                            {doctor.status}
                          </span>
                        </td>
                        <td className="py-3 font-semibold">{doctor.joiningDate ? new Date(doctor.joiningDate).toLocaleDateString() : '-'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(doctor)}
                              className="rounded-xl bg-slate-100 p-2 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doctor)}
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
          <form onSubmit={handleSubmit} className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:p-7 lg:col-span-8">
              <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                <Stethoscope size={250} className="text-slate-900" />
              </div>

              <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <User className="text-emerald-500" size={20} />
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Personnel Details</h2>
                </div>
                <button
                  type="button"
                  onClick={closeAddForm}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                >
                  <ArrowLeft size={14} />
                  BACK TO LIST
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10 relative z-10">
                <InputField label="Doctor Full Name" name="doctorName" value={formData.doctorName} onChange={handleChange} placeholder="ENTER NAME" />
                <InputField label="Qualification" name="qualification" value={formData.qualification} onChange={handleChange} placeholder="MBBS, MD" />
                <InputField label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="E.G. CARDIOLOGY" />
                <InputField label="Reg Number" name="registrationNumber" value={formData.registrationNumber} onChange={handleChange} placeholder="MCI-XXXX" />
                <InputField label="Phone" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+91" />
                <InputField label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="doctor@asha.com" />

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Department</label>
                  <select
                    required
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
                  >
                    <option value="">-- SELECT DEPARTMENT --</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept.deptName}>{dept.deptName}</option>
                    ))}
                  </select>
                </div>

                <InputField label="Date of Joining" name="joiningDate" value={formData.joiningDate} onChange={handleChange} type="date" />
              </div>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
                <div className="flex items-center gap-3 mb-2 border-b border-slate-100 pb-5">
                  <CreditCard className="text-emerald-500" size={20} />
                  <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-600">Revenue Share</h2>
                </div>

                <div className="space-y-4">
                  <InputField label="Fee (INR)" name="consultationFee" value={formData.consultationFee} onChange={handleChange} type="number" />

                  <div className="flex flex-col gap-3">
                    <label className="text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Payment Model</label>
                    <div className="flex p-1.5 bg-slate-50 rounded-2xl border border-slate-200">
                      {['Percentage', 'Fixed'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleChange({ target: { name: 'revenueShareType', value: type } })}
                          className={`flex-1 py-3 rounded-xl text-[11px] font-semibold transition-all ${
                            formData.revenueShareType === type ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:text-emerald-600'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <InputField label="Doc Share" name="doctorShare" value={formData.doctorShare} onChange={handleChange} type="number" />
                    <InputField label="Hosp Share" name="centerShare" value={formData.centerShare} onChange={handleChange} type="number" readOnly />
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] bg-slate-900 p-8 text-white shadow-xl">
                <label className="text-[11px] font-semibold uppercase tracking-[0.3em] mb-6 block text-center opacity-60">Status</label>

                <div className="flex gap-4 mb-8">
                  <StatusBtn label="ACTIVE" value="Active" current={formData.status} onChange={handleChange} activeClass="bg-emerald-500" />
                  <StatusBtn label="INACTIVE" value="Inactive" current={formData.status} onChange={handleChange} activeClass="bg-slate-700" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Save size={22} />}
                  {editingDoctorId ? 'UPDATE DOCTOR' : 'REGISTER DOCTOR'}
                </button>
              </div>
            </div>
          </form>
        )}
      </main>
    </div>
  );
};

const InputField = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">{label}</label>
    <input
      required
      {...props}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none placeholder:font-semibold placeholder:text-slate-300 focus:border-emerald-500"
    />
  </div>
);

const StatusBtn = ({ label, value, current, onChange, activeClass }) => (
  <button
    type="button"
    onClick={() => onChange({ target: { name: 'status', value: value } })}
    className={`flex-1 py-3 rounded-xl text-[10px] font-semibold border border-slate-700 transition-all ${
      current === value ? `${activeClass} text-white border-transparent shadow-lg` : 'text-slate-200 hover:text-white'
    }`}
  >
    {label}
  </button>
);

export default DoctorRegistration;
