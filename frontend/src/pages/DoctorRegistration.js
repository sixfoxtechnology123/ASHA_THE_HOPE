import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
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
      const doctorRes = await axios.get(`${API_BASE_URL}/api/doctors/all`);
      if (doctorRes.data.success) setDoctors(doctorRes.data.data || []);
    } catch (err) {
      console.error('Doctor List Error:', err);
      toast.error('FAILED TO FETCH DOCTOR LIST');
    }
  };

  const fetchInitialData = async () => {
    try {
      const [deptRes, idRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/master/department/all`),
        axios.get(`${API_BASE_URL}/api/doctors/latest-id`)
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
      const idRes = await axios.get(`${API_BASE_URL}/api/doctors/latest-id`);
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
      const res = await axios.delete(`${API_BASE_URL}/api/doctors/${doctor._id}`);
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
        ? await axios.put(`${API_BASE_URL}/api/doctors/update/${editingDoctorId}`, formData)
        : await axios.post(`${API_BASE_URL}/api/doctors/register`, formData);
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
    <div className="min-h-screen bg-sky-50 font-sans font-semibold">
      <header className="p-6 sticky top-0 z-20 bg-sky-50/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[24px] shadow-sm border-b-4 border-sky-400">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-sky-200">
              <Stethoscope size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Doctor Onboarding</h1>
              <p className="text-sm text-sky-600 font-semibold uppercase tracking-widest mt-0.5">Asha Hope Medical Records</p>
            </div>
          </div>

          {showForm ? (
            <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-bold text-sm tracking-wider flex items-center gap-3">
              <ShieldCheck size={18} className="text-sky-400" />
              ID: {formData.doctorId || 'SYNCING...'}
            </div>
          ) : (
            <button
              type="button"
              onClick={openAddForm}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              ADD DOCTOR
            </button>
          )}
        </div>
      </header>
      <main className="px-6 pb-12">
        {!showForm ? (
          <div className="max-w-7xl mx-auto bg-white rounded-[32px] p-8 shadow-md border border-sky-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-sky-50 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-sky-500" size={20} />
                <h2 className="text-sm font-bold text-black uppercase tracking-[0.1em]">Registered Doctors List</h2>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by Doctor Name or ID"
                  className="w-full py-2.5 pl-10 pr-4 border border-sky-100 rounded-xl outline-none focus:border-sky-500 text-sm font-semibold uppercase"
                />
              </div>
            </div>

            {filteredDoctors.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold uppercase">
                {doctors.length === 0 ? 'No doctors registered yet.' : 'No doctor found for this search.'}
              </div>
            ) : (
              <div className="border border-sky-100 rounded-2xl overflow-hidden">
                <div className="max-h-[540px] overflow-auto">
                <table className="w-full min-w-[1050px]">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-sky-600 border-b border-sky-100 bg-white sticky top-0 z-10">
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
                      <tr key={doctor._id} className="border-b border-sky-50 text-sm text-slate-700 font-semibold">
                        <td className="py-3 font-bold">{doctor.doctorId}</td>
                        <td className="py-3 font-semibold">{doctor.doctorName}</td>
                        <td className="py-3 font-semibold">{doctor.department}</td>
                        <td className="py-3 font-semibold">{doctor.specialization}</td>
                        <td className="py-3 font-semibold">{doctor.mobile}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-lg text-xs font-bold ${doctor.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {doctor.status}
                          </span>
                        </td>
                        <td className="py-3 font-semibold">{doctor.joiningDate ? new Date(doctor.joiningDate).toLocaleDateString() : '-'}</td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(doctor)}
                              className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(doctor)}
                              className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
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
          <form onSubmit={handleSubmit} className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white rounded-[32px] p-8 md:p-7 shadow-md border border-sky-100 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 opacity-5 pointer-events-none">
                <Stethoscope size={250} className="text-sky-900" />
              </div>

              <div className="flex items-center justify-between mb-5 border-b border-sky-50 pb-2 relative z-10">
                <div className="flex items-center gap-3">
                  <User className="text-sky-500" size={20} />
                  <h2 className="text-sm font-bold text-black uppercase tracking-[0.1em]">Personnel Details</h2>
                </div>
                <button
                  type="button"
                  onClick={closeAddForm}
                  className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
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
                  <label className="text-[10px] font-semibold text-sky-600 uppercase tracking-widest">Department</label>
                  <select
                    required
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full py-3 border-b-2 border-sky-100 font-medium text-slate-700 outline-none focus:border-sky-500 bg-transparent cursor-pointer uppercase text-sm"
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

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-[32px] p-8 shadow-md border border-sky-100">
                <div className="flex items-center gap-3 mb-2 border-b border-sky-50 pb-5">
                  <CreditCard className="text-sky-500" size={20} />
                  <h2 className="text-sm font-bold text-black uppercase tracking-[0.2em]">Revenue Share</h2>
                </div>

                <div className="space-y-4">
                  <InputField label="Fee (INR)" name="consultationFee" value={formData.consultationFee} onChange={handleChange} type="number" />

                  <div className="flex flex-col gap-3">
                    <label className="text-[11px] font-bold text-sky-600 tracking-widest uppercase text-center mb-1">Payment Model</label>
                    <div className="flex p-1.5 bg-sky-50 rounded-2xl border border-sky-100">
                      {['Percentage', 'Fixed'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => handleChange({ target: { name: 'revenueShareType', value: type } })}
                          className={`flex-1 py-3 rounded-xl text-[11px] font-bold transition-all ${
                            formData.revenueShareType === type ? 'bg-sky-500 text-white shadow-md' : 'text-sky-400 hover:text-sky-600'
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

              <div className="bg-slate-900 rounded-[32px] p-8 shadow-xl text-white">
                <label className="text-[11px] font-bold uppercase tracking-[0.3em] mb-6 block text-center opacity-60">Status</label>

                <div className="flex gap-4 mb-8">
                  <StatusBtn label="ACTIVE" value="Active" current={formData.status} onChange={handleChange} activeClass="bg-sky-500" />
                  <StatusBtn label="INACTIVE" value="Inactive" current={formData.status} onChange={handleChange} activeClass="bg-slate-700" />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
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
    <label className="font-bold text-sky-600 uppercase">{label}</label>
    <input
      required
      {...props}
      className="w-full py-2 border-b-2 border-sky-50 font-semibold text-slate-700 outline-none focus:border-sky-500 bg-transparent transition-all uppercase placeholder:font-semibold placeholder:text-slate-300"
    />
  </div>
);

const StatusBtn = ({ label, value, current, onChange, activeClass }) => (
  <button
    type="button"
    onClick={() => onChange({ target: { name: 'status', value: value } })}
    className={`flex-1 py-3 rounded-xl text-[10px] font-bold border border-slate-700 transition-all ${
      current === value ? `${activeClass} text-white border-transparent shadow-lg` : 'text-black hover:text-white'
    }`}
  >
    {label}
  </button>
);

export default DoctorRegistration;
