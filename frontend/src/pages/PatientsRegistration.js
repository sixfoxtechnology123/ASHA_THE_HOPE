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
  const [activeSection, setActiveSection] = useState('details');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [visitHistory, setVisitHistory] = useState([]);
  const [billingHistory, setBillingHistory] = useState([]);
  const [pharmacyHistory, setPharmacyHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [visitForm, setVisitForm] = useState({
    visitDate: '',
    doctorId: '',
    department: '',
    status: 'Scheduled',
    prescriptionUrl: ''
  });
  const [billingForm, setBillingForm] = useState({
    invoiceNo: '',
    billDate: '',
    doctorId: '',
    department: '',
    amount: '',
    paymentStatus: 'Unpaid'
  });
  const [pharmacyForm, setPharmacyForm] = useState({
    billNo: '',
    medicinesPurchased: '',
    amount: ''
  });
  const [savingHistory, setSavingHistory] = useState(false);
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

  const fetchDoctors = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/doctors/all`);
      if (res.data.success) {
        setDoctors(res.data.data || []);
      }
    } catch (err) {
      toast.error('FAILED TO LOAD DOCTORS');
    }
  };

  useEffect(() => {
    fetchDoctors();
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
    setActiveSection('details');
    setSelectedPatient(null);
    setEditingPatientId(null);
    setFormData(getInitialFormData());
    setShowForm(true);
    await fetchNextPatientId();
  };

  const closeForm = async () => {
    setShowForm(false);
    setEditingPatientId(null);
    setFormData(getInitialFormData());
    setActiveSection('details');
    await fetchNextPatientId();
  };

  const handleEdit = (patient) => {
    setSelectedPatient(patient);
    setActiveSection('details');
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
        if (selectedPatient?._id === patient._id) setSelectedPatient(null);
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

  const doctorMap = useMemo(() => {
    return doctors.reduce((acc, doc) => {
      acc[doc.doctorId] = doc;
      return acc;
    }, {});
  }, [doctors]);

  const loadHistory = async (type, patientMongoId) => {
    if (!patientMongoId) return;
    setLoadingHistory(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/patients/${patientMongoId}/${type}-history`);
      if (res.data.success) {
        if (type === 'visit') setVisitHistory(res.data.data || []);
        if (type === 'billing') setBillingHistory(res.data.data || []);
        if (type === 'pharmacy') setPharmacyHistory(res.data.data || []);
      }
    } catch (err) {
      toast.error('FAILED TO LOAD HISTORY');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!selectedPatient) return;
    if (activeSection === 'visit') loadHistory('visit', selectedPatient._id);
    if (activeSection === 'billing') loadHistory('billing', selectedPatient._id);
    if (activeSection === 'pharmacy') loadHistory('pharmacy', selectedPatient._id);
  }, [activeSection, selectedPatient]);

  const resetVisitForm = () =>
    setVisitForm({ visitDate: '', doctorId: '', department: '', status: 'Scheduled', prescriptionUrl: '' });
  const resetBillingForm = () =>
    setBillingForm({ invoiceNo: '', billDate: '', doctorId: '', department: '', amount: '', paymentStatus: 'Unpaid' });
  const resetPharmacyForm = () =>
    setPharmacyForm({ billNo: '', medicinesPurchased: '', amount: '' });

  const handleVisitChange = (e) => {
    const { name, value } = e.target;
    setVisitForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value } = e.target;
    setBillingForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePharmacyChange = (e) => {
    const { name, value } = e.target;
    setPharmacyForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleVisitDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doctor = doctorMap[doctorId];
    setVisitForm((prev) => ({
      ...prev,
      doctorId,
      department: doctor?.department || prev.department
    }));
  };

  const handleBillingDoctorChange = (e) => {
    const doctorId = e.target.value;
    const doctor = doctorMap[doctorId];
    setBillingForm((prev) => ({
      ...prev,
      doctorId,
      department: doctor?.department || prev.department,
      amount: prev.amount ? prev.amount : doctor?.consultationFee ? String(doctor.consultationFee) : ''
    }));
  };

  const submitVisitHistory = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return toast.error('SELECT A PATIENT');
    if (!visitForm.visitDate || !visitForm.doctorId) return toast.error('VISIT DATE AND DOCTOR REQUIRED');
    setSavingHistory(true);
    try {
      const payload = {
        visitDate: visitForm.visitDate,
        doctorId: visitForm.doctorId,
        doctorName: doctorMap[visitForm.doctorId]?.doctorName || '',
        department: visitForm.department || doctorMap[visitForm.doctorId]?.department || '',
        status: visitForm.status,
        prescriptionUrl: visitForm.prescriptionUrl
      };
      const res = await axios.post(`${API_BASE_URL}/api/patients/${selectedPatient._id}/visit-history`, payload);
      if (res.data.success) {
        toast.success('VISIT HISTORY SAVED');
        resetVisitForm();
        await loadHistory('visit', selectedPatient._id);
      } else {
        toast.error('SAVE FAILED');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'SAVE FAILED');
    } finally {
      setSavingHistory(false);
    }
  };

  const submitBillingHistory = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return toast.error('SELECT A PATIENT');
    if (!billingForm.invoiceNo || !billingForm.billDate) return toast.error('INVOICE NO AND DATE REQUIRED');
    setSavingHistory(true);
    try {
      const payload = {
        invoiceNo: billingForm.invoiceNo,
        billDate: billingForm.billDate,
        doctorId: billingForm.doctorId,
        doctorName: billingForm.doctorId ? doctorMap[billingForm.doctorId]?.doctorName || '' : '',
        department: billingForm.department || (billingForm.doctorId ? doctorMap[billingForm.doctorId]?.department || '' : ''),
        amount: billingForm.amount ? Number(billingForm.amount) : 0,
        paymentStatus: billingForm.paymentStatus
      };
      const res = await axios.post(`${API_BASE_URL}/api/patients/${selectedPatient._id}/billing-history`, payload);
      if (res.data.success) {
        toast.success('BILLING HISTORY SAVED');
        resetBillingForm();
        await loadHistory('billing', selectedPatient._id);
      } else {
        toast.error('SAVE FAILED');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'SAVE FAILED');
    } finally {
      setSavingHistory(false);
    }
  };

  const submitPharmacyHistory = async (e) => {
    e.preventDefault();
    if (!selectedPatient) return toast.error('SELECT A PATIENT');
    if (!pharmacyForm.billNo || !pharmacyForm.medicinesPurchased) return toast.error('BILL NO AND MEDICINES REQUIRED');
    setSavingHistory(true);
    try {
      const payload = {
        billNo: pharmacyForm.billNo,
        medicinesPurchased: pharmacyForm.medicinesPurchased,
        amount: pharmacyForm.amount ? Number(pharmacyForm.amount) : 0
      };
      const res = await axios.post(`${API_BASE_URL}/api/patients/${selectedPatient._id}/pharmacy-history`, payload);
      if (res.data.success) {
        toast.success('PHARMACY HISTORY SAVED');
        resetPharmacyForm();
        await loadHistory('pharmacy', selectedPatient._id);
      } else {
        toast.error('SAVE FAILED');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'SAVE FAILED');
    } finally {
      setSavingHistory(false);
    }
  };

  const historyEmptyState = (message) => (
    <div className="py-12 text-center text-slate-500 font-bold uppercase">{message}</div>
  );

  const sectionTabs = [
    { id: 'details', label: 'Patients Details' },
    { id: 'visit', label: 'Visit History' },
    { id: 'billing', label: 'Billing History' },
    { id: 'pharmacy', label: 'Pharmacy History' }
  ];

  return (
    <div className="page-shell">
      <header className="page-header">
        <div className="header-card">
          <div className="header-row">
            <div className="header-icon">
              <UserPlus size={30} />
            </div>
            <div>
              <h1 className="header-title">Patients Registration</h1>
              <p className="header-subtitle">Create New Patient Profile</p>
            </div>
          </div>

          {!showForm ? (
            <button
              type="button"
              onClick={openAddForm}
              className="btn-primary"
            >
              <Plus size={16} />
              ADD PATIENT
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
        {isEditMode && (
          <div className="max-w-7xl mx-auto mb-5">
            <div className="bg-white rounded-[22px] p-2 shadow-sm border border-slate-200 flex flex-wrap gap-2">
              {sectionTabs.map((tab) => {
                const isActive = activeSection === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSection(tab.id)}
                    className={`px-4 py-2 rounded-2xl text-sm font-bold tracking-wide transition-all ${
                      isActive
                        ? 'bg-[color:var(--brand-500)] text-white shadow-md'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isEditMode && selectedPatient && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="bg-white border border-slate-200 rounded-[18px] px-4 py-3 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="text-sm text-slate-700">
                <span className="font-bold text-slate-800">Selected Patient:</span>{' '}
                {selectedPatient.fullName || '-'} ({selectedPatient.patientId})
                {selectedPatient.mobileNumber ? ` | ${selectedPatient.mobileNumber}` : ''}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="btn-ghost"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {!isEditMode && !showForm ? (
          <div className="card">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-3 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <List className="text-[color:var(--brand-500)]" size={20} />
                <h2 className="card-title">Patients List</h2>
              </div>
              <div className="relative w-full lg:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name/mobile/patient id"
                  className="search-input"
                />
              </div>
            </div>

            {loadingList ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-[color:var(--brand-500)]" />
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-bold uppercase">No patients found.</div>
            ) : (
              <div className="table-wrap">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="table-head sticky top-0 z-10">
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
                        <tr
                          key={patient._id}
                          className={`table-row cursor-pointer ${
                            selectedPatient?.patientId === patient.patientId ? 'bg-slate-50' : 'bg-white'
                          }`}
                          onClick={() => setSelectedPatient(patient)}
                        >
                          <td className="py-2 px-3 font-bold text-[color:var(--brand-600)]">{patient.patientId}</td>
                          <td className="py-2 px-3">{patient.fullName || '-'}</td>
                          <td className="py-2 px-3">{patient.mobileNumber || '-'}</td>
                          <td className="py-2 px-3">{patient.gender || '-'}</td>
                          <td className="py-2 px-3">{patient.department || '-'}</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEdit(patient);
                                }}
                                className="icon-btn"
                                title="Edit patient"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(patient);
                                }}
                                className="danger-btn"
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
        ) : activeSection === 'details' ? (
        <form onSubmit={handleSubmit} className="card space-y-6">
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
              className="w-full py-2 btn-primary justify-center disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
              {isEditMode ? 'UPDATE PATIENT' : 'SAVE PATIENT'}
            </button>
          </div>
        </form>
        ) : isEditMode && activeSection === 'visit' ? (
          <div className="card">
            <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
              <List className="text-[color:var(--brand-500)]" size={20} />
              <h2 className="card-title">Visit History</h2>
            </div>
            <form onSubmit={submitVisitHistory} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                <InputField label="Visit Date" type="date" name="visitDate" value={visitForm.visitDate} onChange={handleVisitChange} required />
                <SelectField label="Doctor" name="doctorId" value={visitForm.doctorId} onChange={handleVisitDoctorChange}>
                  <option value="">-- SELECT DOCTOR --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.doctorId}>{doc.doctorName}</option>
                  ))}
                </SelectField>
                <SelectField label="Department" name="department" value={visitForm.department} onChange={handleVisitChange} required={false}>
                  <option value="">-- SELECT DEPARTMENT --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.deptName}>{dept.deptName}</option>
                  ))}
                </SelectField>
                <SelectField label="Status" name="status" value={visitForm.status} onChange={handleVisitChange}>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </SelectField>
                <InputField label="Prescription URL" name="prescriptionUrl" value={visitForm.prescriptionUrl} onChange={handleVisitChange} required={false} />
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={savingHistory} className="btn-primary disabled:opacity-60">
                  {savingHistory ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  SAVE VISIT
                </button>
              </div>
            </form>
            {!selectedPatient ? (
              historyEmptyState('Select a patient to view visit history')
            ) : loadingHistory ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-[color:var(--brand-500)]" />
              </div>
            ) : visitHistory.length === 0 ? (
              historyEmptyState('visit history')
            ) : (
              <div className="table-wrap">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="table-head sticky top-0 z-10">
                        <th className="py-2 px-3">Visit Date</th>
                        <th className="py-2 px-3">Doctor</th>
                        <th className="py-2 px-3">Department</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3">Prescription View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visitHistory.map((item) => (
                        <tr key={item._id} className="table-row">
                          <td className="py-2 px-3">{item.visitDate || '-'}</td>
                          <td className="py-2 px-3">{item.doctorName || doctorMap[item.doctorId]?.doctorName || '-'}</td>
                          <td className="py-2 px-3">{item.department || doctorMap[item.doctorId]?.department || '-'}</td>
                          <td className="py-2 px-3">{item.status || '-'}</td>
                          <td className="py-2 px-3">
                            {item.prescriptionUrl ? (
                              <a
                                className="text-[color:var(--brand-600)] hover:underline"
                                href={item.prescriptionUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : isEditMode && activeSection === 'billing' ? (
          <div className="card">
            <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
              <List className="text-[color:var(--brand-500)]" size={20} />
              <h2 className="card-title">Billing History</h2>
            </div>
            <form onSubmit={submitBillingHistory} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <InputField label="Invoice No" name="invoiceNo" value={billingForm.invoiceNo} onChange={handleBillingChange} required />
                <InputField label="Date" type="date" name="billDate" value={billingForm.billDate} onChange={handleBillingChange} required />
                <SelectField label="Doctor" name="doctorId" value={billingForm.doctorId} onChange={handleBillingDoctorChange} required={false}>
                  <option value="">-- SELECT DOCTOR --</option>
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.doctorId}>{doc.doctorName}</option>
                  ))}
                </SelectField>
                <SelectField label="Department" name="department" value={billingForm.department} onChange={handleBillingChange} required={false}>
                  <option value="">-- SELECT DEPARTMENT --</option>
                  {departments.map((dept) => (
                    <option key={dept._id} value={dept.deptName}>{dept.deptName}</option>
                  ))}
                </SelectField>
                <InputField label="Amount" type="number" name="amount" value={billingForm.amount} onChange={handleBillingChange} required={false} />
                <SelectField label="Payment Status" name="paymentStatus" value={billingForm.paymentStatus} onChange={handleBillingChange}>
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Partial">Partial</option>
                </SelectField>
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={savingHistory} className="btn-primary disabled:opacity-60">
                  {savingHistory ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  SAVE BILL
                </button>
              </div>
            </form>
            {!selectedPatient ? (
              historyEmptyState('Select a patient to view billing history')
            ) : loadingHistory ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-[color:var(--brand-500)]" />
              </div>
            ) : billingHistory.length === 0 ? (
              historyEmptyState('billing history')
            ) : (
              <div className="table-wrap">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="table-head sticky top-0 z-10">
                        <th className="py-2 px-3">Invoice No</th>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Amount</th>
                        <th className="py-2 px-3">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((item) => {
                        const amountValue = Number(item.amount);
                        const doctorFee = item.doctorId ? Number(doctorMap[item.doctorId]?.consultationFee || 0) : 0;
                        const finalAmount = amountValue > 0 ? amountValue : doctorFee;
                        return (
                          <tr key={item._id} className="table-row">
                            <td className="py-2 px-3">{item.invoiceNo || '-'}</td>
                            <td className="py-2 px-3">{item.billDate || '-'}</td>
                            <td className="py-2 px-3">{finalAmount ? finalAmount.toFixed(2) : '-'}</td>
                            <td className="py-2 px-3">{item.paymentStatus || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : isEditMode ? (
          <div className="card">
            <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3">
              <List className="text-[color:var(--brand-500)]" size={20} />
              <h2 className="card-title">Pharmacy History</h2>
            </div>
            <form onSubmit={submitPharmacyHistory} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <InputField label="Bill No" name="billNo" value={pharmacyForm.billNo} onChange={handlePharmacyChange} required />
                <InputField label="Medicines Purchased" name="medicinesPurchased" value={pharmacyForm.medicinesPurchased} onChange={handlePharmacyChange} required />
                <InputField label="Amount" type="number" name="amount" value={pharmacyForm.amount} onChange={handlePharmacyChange} required={false} />
              </div>
              <div className="mt-3 flex justify-end">
                <button type="submit" disabled={savingHistory} className="btn-primary disabled:opacity-60">
                  {savingHistory ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  SAVE PHARMACY
                </button>
              </div>
            </form>
            {!selectedPatient ? (
              historyEmptyState('Select a patient to view pharmacy history')
            ) : loadingHistory ? (
              <div className="py-10 flex justify-center">
                <Loader2 className="animate-spin text-[color:var(--brand-500)]" />
              </div>
            ) : pharmacyHistory.length === 0 ? (
              historyEmptyState('pharmacy history')
            ) : (
              <div className="table-wrap">
                <div className="max-h-[540px] overflow-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="table-head sticky top-0 z-10">
                        <th className="py-2 px-3">Bill No</th>
                        <th className="py-2 px-3">Medicines Purchased</th>
                        <th className="py-2 px-3">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pharmacyHistory.map((item) => (
                        <tr key={item._id} className="table-row">
                          <td className="py-2 px-3">{item.billNo || '-'}</td>
                          <td className="py-2 px-3">{item.medicinesPurchased || '-'}</td>
                          <td className="py-2 px-3">{Number(item.amount) ? Number(item.amount).toFixed(2) : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
};

const InputField = ({ label, required = false, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="field-label">{label}</label>
    <input
      required={required}
      {...props}
      className="input-field disabled:bg-slate-50 disabled:text-slate-400 uppercase placeholder:normal-case"
    />
  </div>
);

const SelectField = ({ label, children, required = true, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="field-label">{label}</label>
    <select
      required={required}
      {...props}
      className="select-field uppercase"
    >
      {children}
    </select>
  </div>
);

const TextAreaField = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="field-label">{label}</label>
    <textarea
      rows={4}
      {...props}
      className="textarea-field uppercase"
    />
  </div>
);

export default PatientsRegistration;
