import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';
import { UserPlus, Save, Loader2, Plus, ArrowLeft, Search, List, Edit, Trash2 } from 'lucide-react';

const getInitialFormData = () => ({
  patientId: '',
  fullName: '',
  gender: 'Male',
  dob: '',
  age: '',
  mobileNumber: '',
  alternateMobile: '',
  address: '',
  bloodGroup: '',
  allergies: '',
  knownMedicalConditions: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  department: '',
  notes: ''
});

const calculateAge = (dob) => {
  if (!dob) return '';
  const birthDate = new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age -= 1;
  return age < 0 ? 0 : age;
};

const PatientsRegistration = () => {
  const [loadingId, setLoadingId] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState(getInitialFormData());
  const isEditMode = Boolean(editingPatientId);

  const fetchNextPatientId = async () => {
    setLoadingId(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patients/latest-id`);
      if (res.data.success) {
        setFormData((prev) => ({ ...prev, patientId: res.data.nextId }));
      }
    } catch (err) {
      toast.error('FAILED TO LOAD PATIENT ID');
    } finally {
      setLoadingId(false);
    }
  };

  useEffect(() => {
    fetchNextPatientId();
  }, []);

  const fetchPatients = async () => {
    setLoadingList(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patients/all`);
      if (res.data.success) {
        setPatients(res.data.data || []);
      }
    } catch (err) {
      toast.error('FAILED TO LOAD PATIENTS');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/master/department/all`);
      if (res.data.success) {
        const deptList = res.data.data || [];
        setDepartments(deptList);
      }
    } catch (err) {
      toast.error('FAILED TO LOAD DEPARTMENTS');
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, age: calculateAge(prev.dob) }));
  }, [formData.dob]);

  const maxDob = useMemo(() => new Date().toISOString().split('T')[0], []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const openAddForm = async () => {
    setEditingPatientId(null);
    setFormData(getInitialFormData());
    setShowForm(true);
    await fetchNextPatientId();
  };

  const closeForm = async () => {
    setShowForm(false);
    setEditingPatientId(null);
    setFormData(getInitialFormData());
    await fetchNextPatientId();
  };

  const handleEdit = (patient) => {
    setEditingPatientId(patient._id);
    setFormData({
      patientId: patient.patientId || '',
      fullName: patient.fullName || '',
      gender: patient.gender || 'Male',
      dob: patient.dob || '',
      age: patient.age ?? '',
      mobileNumber: patient.mobileNumber || '',
      alternateMobile: patient.alternateMobile || '',
      address: patient.address || '',
      bloodGroup: patient.bloodGroup || '',
      allergies: patient.allergies || '',
      knownMedicalConditions: patient.knownMedicalConditions || '',
      emergencyContactName: patient.emergencyContactName || '',
      emergencyContactNumber: patient.emergencyContactNumber || '',
      department: patient.department || '',
      notes: patient.notes || ''
    });
    setShowForm(true);
  };

  const handleDelete = async (patient) => {
    const confirmed = window.confirm(`Delete ${patient.fullName} (${patient.patientId})?`);
    if (!confirmed) return;
    try {
      const res = await axios.delete(`${API_BASE_URL}/api/patients/${patient._id}`);
      if (res.data.success) {
        toast.success('PATIENT DELETED');
        await fetchPatients();
      } else {
        toast.error('DELETE FAILED');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'DELETE FAILED');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) return toast.error('FULL NAME IS REQUIRED');
    if (!formData.mobileNumber.trim()) return toast.error('MOBILE NUMBER IS REQUIRED');
    if (!formData.department) return toast.error('DEPARTMENT IS REQUIRED');

    setSaving(true);
    try {
      const payload = {
        fullName: formData.fullName,
        gender: formData.gender,
        dob: formData.dob,
        mobileNumber: formData.mobileNumber,
        alternateMobile: formData.alternateMobile,
        address: formData.address,
        bloodGroup: formData.bloodGroup,
        allergies: formData.allergies,
        knownMedicalConditions: formData.knownMedicalConditions,
        emergencyContactName: formData.emergencyContactName,
        emergencyContactNumber: formData.emergencyContactNumber,
        department: formData.department,
        notes: formData.notes
      };

      const res = isEditMode
        ? await axios.put(`${API_BASE_URL}/api/patients/update/${editingPatientId}`, payload)
        : await axios.post(`${API_BASE_URL}/api/patients/register`, payload);
      if (res.data.success) {
        toast.success(isEditMode ? `PATIENT UPDATED | ID ${res.data.data.patientId}` : `PATIENT REGISTERED | ID ${res.data.data.patientId}`);
        await fetchPatients();
        await closeForm();
      } else {
        toast.error(isEditMode ? 'UPDATE FAILED' : 'REGISTRATION FAILED');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || (isEditMode ? 'UPDATE FAILED' : 'REGISTRATION FAILED'));
    } finally {
      setSaving(false);
    }
  };

  const filteredPatients = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((item) =>
      [item.fullName, item.mobileNumber, item.patientId].join(' ').toLowerCase().includes(q)
    );
  }, [patients, searchTerm]);

  return (
    <div className="min-h-screen bg-sky-50 font-sans font-semibold">
      <header className="p-6 sticky top-0 z-20 bg-sky-50/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-3 rounded-[24px] shadow-sm border-b-4 border-sky-400">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-sky-500 rounded-2xl text-white flex items-center justify-center shadow-lg shadow-sky-200">
              <UserPlus size={30} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Patients Registration</h1>
              <p className="text-sm text-sky-600 font-semibold uppercase tracking-widest mt-0.5">Create New Patient Profile</p>
            </div>
          </div>

          {!showForm ? (
            <button
              type="button"
              onClick={openAddForm}
              className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2 transition-all"
            >
              <Plus size={16} />
              ADD PATIENT
            </button>
          ) : (
            <button
              type="button"
              onClick={closeForm}
              className="bg-slate-900 text-white px-6 py-2 rounded-2xl font-bold text-sm tracking-wider flex items-center gap-2"
            >
              <ArrowLeft size={16} />
              BACK TO LIST
            </button>
          )}
        </div>
      </header>

      <main className="px-6 pb-12">
        {!showForm ? (
          <div className="max-w-7xl mx-auto bg-white rounded-[32px] p-4 shadow-md border border-sky-100">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-3 border-b border-sky-50 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-sky-500" size={20} />
                <h2 className="text-sm font-bold text-black uppercase tracking-[0.1em]">Patients List</h2>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name/mobile/patient id"
                  className="w-full py-2.5 pl-10 pr-4 border border-sky-100 rounded-xl outline-none focus:border-sky-500 text-sm font-semibold uppercase"
                />
              </div>
            </div>

            {loadingList ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-sky-500" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold uppercase">No patients found.</div>
            ) : (
              <div className="border border-sky-100 rounded-2xl overflow-hidden">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="text-left text-xs font-bold uppercase tracking-wider text-sky-600 border-b border-sky-100 bg-white sticky top-0 z-10">
                        <th className="py-2 px-3">Patient ID</th>
                        <th className="py-2 px-3">Full Name</th>
                        <th className="py-2 px-3">Mobile</th>
                        <th className="py-2 px-3">Gender</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPatients.map((patient) => (
                        <tr key={patient._id} className="border-b border-sky-50 text-sm text-slate-700 font-semibold">
                          <td className="py-2 px-3 font-bold text-sky-700">{patient.patientId}</td>
                          <td className="py-2 px-3">{patient.fullName || '-'}</td>
                          <td className="py-2 px-3">{patient.mobileNumber || '-'}</td>
                          <td className="py-2 px-3">{patient.gender || '-'}</td>
                          <td className="py-2 px-3">{patient.department || '-'}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(patient)}
                                className="p-2 bg-sky-50 text-sky-600 rounded-xl hover:bg-sky-600 hover:text-white transition-all"
                                title="Edit patient"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(patient)}
                                className="p-2 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                                title="Delete patient"
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
        <form onSubmit={handleSubmit} className="max-w-7xl mx-auto bg-white rounded-[28px] p-6 border border-sky-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              label="Patient ID (Auto)"
              name="patientId"
              value={loadingId ? 'LOADING...' : formData.patientId}
              onChange={handleChange}
              readOnly
            />
            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} required />
            <SelectField label="Gender" name="gender" value={formData.gender} onChange={handleChange}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="DOB" type="date" name="dob" value={formData.dob} onChange={handleChange} max={maxDob} required={false} />
            <InputField label="Age (Auto)" name="age" value={formData.age} onChange={handleChange} readOnly required={false} />
            <InputField label="Mobile Number" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField label="Alternate Mobile" name="alternateMobile" value={formData.alternateMobile} onChange={handleChange} required={false} />
            <InputField label="Emergency Contact Name" name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} required={false} />
            <InputField label="Emergency Contact Number" name="emergencyContactNumber" value={formData.emergencyContactNumber} onChange={handleChange} required={false} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectField label="Department" name="department" value={formData.department} onChange={handleChange}>
              <option value="">-- SELECT DEPARTMENT --</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept.deptName}>{dept.deptName}</option>
              ))}
            </SelectField>
            <SelectField label="Blood Group" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} required={false}>
              <option value="">-- SELECT BLOOD GROUP --</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </SelectField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextAreaField label="Address" name="address" value={formData.address} onChange={handleChange} />
            <TextAreaField label="Allergies" name="allergies" value={formData.allergies} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextAreaField
              label="Known Medical Conditions"
              name="knownMedicalConditions"
              value={formData.knownMedicalConditions}
              onChange={handleChange}
            />
            <TextAreaField label="Notes" name="notes" value={formData.notes} onChange={handleChange} />
          </div>

          <div className="bg-slate-900 rounded-[28px] p-6 shadow-xl text-white">
            <button
              type="submit"
              disabled={saving || loadingId}
              className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-sky-500/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {isEditMode ? 'UPDATE PATIENT' : 'SAVE PATIENT'}
            </button>
          </div>
        </form>
        )}
      </main>
    </div>
  );
};

const InputField = ({ label, required = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">{label}</label>
    <input
      required={required}
      {...props}
      className="w-full py-1.5 px-3 border border-sky-100 rounded-xl font-semibold text-black outline-none focus:border-sky-500 bg-white disabled:bg-slate-50 disabled:text-slate-400 uppercase placeholder:normal-case"
    />
  </div>
);

const SelectField = ({ label, children, required = true, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">{label}</label>
    <select
      required={required}
      {...props}
      className="w-full py-1.5 px-3 border border-sky-100 rounded-xl font-semibold text-xs text-black outline-none focus:border-sky-500 bg-white uppercase"
    >
      {children}
    </select>
  </div>
);

const TextAreaField = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-xs font-bold text-sky-600 uppercase tracking-widest">{label}</label>
    <textarea
      rows={4}
      {...props}
      className="w-full py-1.5 px-3 border border-sky-100 rounded-xl font-semibold text-black outline-none focus:border-sky-500 bg-white uppercase"
    />
  </div>
);

export default PatientsRegistration;
