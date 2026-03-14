import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL, api } from '../config/api'; // Use your existing api config
import { 
  FileText, Save, Printer, Send, Plus, Trash2, Edit, List, Search, ArrowLeft,
  Stethoscope, User, Calendar, Activity, Upload, Loader2 
} from 'lucide-react';

const Prescription = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [tab, setTab] = useState('digital');
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]); // Master Appointment list
  const [patients, setPatients] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nextId, setNextId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadMeta, setUploadMeta] = useState(null);

  const initialFormData = {
    doctorId: '',
    patientId: '',
    visitDate: new Date().toISOString().split('T')[0],
    vitals: { bp: '', weight: '', temp: '', sugar: '' },
    clinical: { symptoms: '', diagnosis: '', advice: '' },
    medicines: [{ name: '', dosage: '', frequency: '', duration: '', instructions: '' }],
    uploadUrl: '',
    description: '',
    nextVisitDate: ''
  };

  const [formData, setFormData] = useState(initialFormData);

  // 1. Fetch Masters & Appointments
  const fetchData = async () => {
    setLoading(true);
    try {
      const [drRes, apptRes, patientRes, prRes] = await Promise.all([
        api.get('/doctors/all'),
        api.get('/appointments/all'), // This pulls the appointment master
        api.get('/patients/all'),
        api.get('/prescriptions/all')
      ]);
      if (drRes.data.success) setDoctors(drRes.data.data || []);
      if (apptRes.data.success) setAppointments(apptRes.data.data || []);
      if (patientRes.data.success) setPatients(patientRes.data.data || []);
      if (prRes.data.success) setPrescriptions(prRes.data.data || []);
    } catch (err) {
      toast.error('FAILED TO LOAD DATA');
    } finally {
      setLoading(false);
    }
  };

  // 2. DOCTOR WISE PATIENT FILTER LOGIC
  const bookedPatients = useMemo(() => {
    if (!formData.doctorId) return [];

    const selectedDoctor = doctors.find((doc) => doc.doctorId === formData.doctorId);
    if (!selectedDoctor?.doctorId) return [];

    // Filter appointments by selected doctorId (string ID from appointment records)
    const filteredAppointments = appointments.filter(
      (appt) => appt.doctorId === selectedDoctor.doctorId
    );

    const appointmentIds = new Set(
      filteredAppointments.map((appt) => appt.appointmentId).filter(Boolean)
    );

    // Match registered patients by appointmentId
    return patients
      .filter((p) => appointmentIds.has(p.appointmentId))
      .map((p) => ({
        id: p.patientId,
        name: p.fullName || 'UNKNOWN',
        appointmentId: p.appointmentId || ''
      }));
  }, [formData.doctorId, doctors, appointments, patients]);

  const doctorMap = useMemo(() => {
    return doctors.reduce((acc, doc) => {
      acc[doc.doctorId] = doc;
      return acc;
    }, {});
  }, [doctors]);

  const patientMap = useMemo(() => {
    return patients.reduce((acc, p) => {
      acc[p.patientId] = p;
      return acc;
    }, {});
  }, [patients]);

  const fetchNextId = async () => {
    if (editingId) return;
    try {
      const typeParam = tab === 'digital' ? 'Digital' : 'Handwritten';
      const res = await api.get(`/prescriptions/latest-id?type=${typeParam}`);
      if (res.data.success) setNextId(res.data.nextId);
    } catch (err) {
      console.error("ID Fetch Error");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showForm) fetchNextId();
  }, [tab, showForm]);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post('/prescriptions/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setFormData({ ...formData, uploadUrl: res.data.url });
        setUploadMeta(res.data.file || null);
      } else {
        toast.error('UPLOAD FAILED');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'UPLOAD FAILED');
    } finally {
      setUploading(false);
    }
  };

  const addMedicine = () => {
    setFormData({
      ...formData,
      medicines: [...formData.medicines, { name: '', dosage: '', frequency: '', duration: '', instructions: '' }]
    });
  };

  const removeMedicine = (index) => {
    const list = [...formData.medicines];
    list.splice(index, 1);
    setFormData({ ...formData, medicines: list });
  };

  const handleEdit = (item) => {
    setEditingId(item._id);
    setTab(item.type?.toLowerCase() === 'handwritten' ? 'handwritten' : 'digital');
    setNextId(item.prescriptionId);
    setFormData({
      doctorId: item.doctor || '',
      patientId: item.patient || '',
      visitDate: item.visitDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      vitals: item.vitals || initialFormData.vitals,
      clinical: item.clinical || initialFormData.clinical,
      medicines: item.medicines || initialFormData.medicines,
      uploadUrl: item.uploadUrl || '',
      description: item.description || '',
      nextVisitDate: item.nextVisitDate?.split('T')[0] || ''
    });
    setShowForm(true);
  };

  const handlePrint = (item) => {
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) return;

    const doctorName = doctorMap[item.doctor]?.doctorName || item.doctor || '-';
    const patientName = patientMap[item.patient]?.fullName || item.patient || '-';
    const isHandwritten = String(item.type || '').toLowerCase() === 'handwritten';
    const uploadSrc = item.uploadUrl ? `${API_BASE_URL}${item.uploadUrl}` : '';

    const medicinesHtml = (item.medicines || [])
      .map(
        (m, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${m.name || '-'}</td>
            <td>${m.dosage || '-'}</td>
            <td>${m.frequency || '-'}</td>
            <td>${m.duration || '-'}</td>
            <td>${m.instructions || '-'}</td>
          </tr>
        `
      )
      .join('');

    const visitDate = item.visitDate ? new Date(item.visitDate).toLocaleDateString() : '-';
    const nextVisitDate = item.nextVisitDate ? new Date(item.nextVisitDate).toLocaleDateString() : '-';

    win.document.write(`
      <html>
        <head>
          <title>Prescription ${item.prescriptionId || ''}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
            h1 { font-size: 18px; margin: 0 0 8px; }
            .meta { font-size: 12px; margin-bottom: 16px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #f3f4f6; }
            .section { margin: 16px 0; }
            .img-wrap { margin-top: 12px; }
            .img-wrap img { max-width: 100%; max-height: 420px; object-fit: contain; border: 1px solid #eee; }
          </style>
        </head>
        <body>
          <h1>Prescription ${item.prescriptionId || ''}</h1>
          <div class="meta">
            <div>Type: ${item.type || '-'}</div>
            <div>Patient: ${patientName}</div>
            <div>Doctor: ${doctorName}</div>
            <div>Visit Date: ${visitDate}</div>
            <div>Next Visit Date: ${nextVisitDate}</div>
          </div>

          ${
            isHandwritten
              ? `
                ${item.description ? `<div class="section"><strong>Description</strong><div>${item.description}</div></div>` : ''}
                ${
                  uploadSrc
                    ? `<div class="section img-wrap"><strong>Prescription Image</strong><div><img src="${uploadSrc}" alt="Prescription" /></div></div>`
                    : `<div class="section"><strong>Prescription Image</strong><div>No file uploaded</div></div>`
                }
              `
              : `
                <div class="section">
                  <strong>Vitals</strong>
                  <div>BP: ${item.vitals?.bp || '-'} | Weight: ${item.vitals?.weight || '-'} | Temp: ${item.vitals?.temp || '-'} | Sugar: ${item.vitals?.sugar || '-'}</div>
                </div>

                <div class="section">
                  <strong>Clinical</strong>
                  <div>Symptoms: ${item.clinical?.symptoms || '-'}</div>
                  <div>Diagnosis: ${item.clinical?.diagnosis || '-'}</div>
                  <div>Advice: ${item.clinical?.advice || '-'}</div>
                </div>

                <div class="section">
                  <strong>Medicines</strong>
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Medicine Name</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${medicinesHtml || '<tr><td colspan="6">No medicines</td></tr>'}
                    </tbody>
                  </table>
                </div>
              `
          }
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const handleSave = async (actionType) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        doctor: formData.doctorId,
        patient: formData.patientId,
        type: tab === 'digital' ? 'Digital' : 'Handwritten',
        prescriptionId: nextId
      };
      const res = editingId 
        ? await api.put(`/prescriptions/update/${editingId}`, payload)
        : await api.post('/prescriptions/add', payload);

      if (res.data.success) {
        toast.success(editingId ? "UPDATED" : "SAVED");
        setShowForm(false);
        setEditingId(null);
        setFormData(initialFormData);
        fetchData();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "SAVE FAILED");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await api.delete(`/prescriptions/${id}`);
      if (res.data.success) {
        toast.success("DELETED");
        fetchData();
      }
    } catch (err) { toast.error("DELETE FAILED"); }
  };

  const filteredPrescriptions = useMemo(() => {
    const q = (searchTerm || '').trim().toUpperCase();
    if (!q) return prescriptions;
    return prescriptions.filter((item) => {
      const patientName = patientMap[item.patient]?.fullName || '';
      const doctorName = doctorMap[item.doctor]?.doctorName || '';
      const hay = [
        item.prescriptionId,
        item.patient,
        patientName,
        item.doctor,
        doctorName
      ]
        .filter(Boolean)
        .join(' ')
        .toUpperCase();
      return hay.includes(q);
    });
  }, [prescriptions, searchTerm, doctorMap, patientMap]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-semibold">
      
      {/* TOP HEADER WITH ADD BUTTON */}
      {!showForm && (
        <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center bg-white p-4 rounded-[24px] shadow-sm border border-slate-200">
           <div className="flex items-center gap-3">
             <div className="bg-emerald-500 p-2 rounded-xl text-white"><FileText size={20}/></div>
             <h2 className="text-sm font-bold uppercase text-slate-700 tracking-wider">Prescriptions</h2>
           </div>
           <button onClick={() => { setEditingId(null); setFormData(initialFormData); setShowForm(true); }} className="bg-emerald-500 text-white px-6 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-200 transition">
             <Plus size={18}/> Add Prescription
           </button>
        </div>
      )}

      <div className="mx-auto max-w-6xl rounded-[28px] border border-slate-200 bg-white shadow-xl relative">
        
        {/* 1. FIXED/STICKY HEADER TOGGLE */}
        <div className="sticky top-0 z-30 flex flex-col sm:flex-row bg-slate-900 p-2 shadow-lg gap-2">
          {showForm && (
            <button onClick={() => setShowForm(false)} className="px-4 text-white hover:bg-slate-800 rounded-xl transition">
              <ArrowLeft size={20}/>
            </button>
          )}
          <button 
            onClick={() => setTab('digital')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition ${tab === 'digital' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Activity size={18} /> Digital Prescription
          </button>
          <button 
            onClick={() => setTab('handwritten')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-widest transition ${tab === 'handwritten' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            <Upload size={18} /> Handwritten Upload
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {!showForm ? (
            /* 2. LIST VIEW SECTION */
            <div className="animate-in fade-in duration-500">
               <div className="relative mb-4">
                  <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  <input 
                    type="text" 
                    placeholder="Search Patient Name or ID..." 
                    className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-100 text-xs sm:text-sm font-bold outline-none focus:border-emerald-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                  />
               </div>
               <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-[10px] uppercase font-black text-emerald-600 tracking-widest">
                      <tr>
                        <th className="p-3 sm:p-4">ID</th>
                        <th className="p-3 sm:p-4">Patient</th>
                        <th className="p-3 sm:p-4">Doctor</th>
                        <th className="p-3 sm:p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
                      {filteredPrescriptions.map((item) => (
                        <tr key={item._id} className="hover:bg-slate-50/50">
                          <td className="p-3 sm:p-4 text-emerald-600">{item.prescriptionId}</td>
                          <td className="p-3 sm:p-4">{patientMap[item.patient]?.fullName || item.patient || '-'}</td>
                          <td className="p-3 sm:p-4 text-slate-400 text-xs sm:text-sm">{doctorMap[item.doctor]?.doctorName || item.doctor || '-'}</td>
                          <td className="p-3 sm:p-4">
                            <div className="flex items-center justify-center gap-3">
                              <button onClick={() => handlePrint(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Printer size={16}/></button>
                              <button onClick={() => handleEdit(item)} className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg"><Edit size={16}/></button>
                              <button onClick={() => handleDelete(item._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </div>
          ) : (
            /* 3. FORM VIEW SECTION */
            <>
              {/* TOP SECTION: IDs & MASTERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-emerald-600">ID</label>
                    <input value={nextId} readOnly className="bg-white border p-2 rounded-xl text-sm outline-none text-slate-900 font-bold" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-emerald-600">Doctor</label>
                    <select 
                      className="bg-white border p-2 rounded-xl text-sm focus:border-emerald-500 outline-none"
                      value={formData.doctorId}
                      onChange={(e) => setFormData({...formData, doctorId: e.target.value, patientId: ''})}
                    >
                      <option value="">-- SELECT DOCTOR --</option>
                      {doctors.map(dr => <option key={dr._id} value={dr.doctorId}>{dr.doctorName}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-emerald-600">Booked Patient</label>
                    <select 
                      className="bg-white border p-2 rounded-xl text-sm focus:border-emerald-500 outline-none"
                      value={formData.patientId}
                      disabled={!formData.doctorId}
                      onChange={(e) => setFormData({...formData, patientId: e.target.value})}
                    >
                      <option value="">-- SELECT PATIENT --</option>
                      {bookedPatients.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name}{p.appointmentId ? ` | ${p.appointmentId}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-extrabold uppercase text-emerald-600">Visit Date</label>
                    <input 
                      type="date" 
                      className="bg-white border p-2 rounded-xl text-sm" 
                      value={formData.visitDate} 
                      onChange={(e) => setFormData({...formData, visitDate: e.target.value})}
                    />
                  </div>
              </div>

              {tab === 'digital' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  {/* VITALS */}
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-400 mb-3 flex items-center gap-2"><Activity size={14}/> Vitals Section</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['bp', 'weight', 'temp', 'sugar'].map(v => (
                        <input 
                          key={v} 
                          placeholder={v.toUpperCase()} 
                          className="border p-3 rounded-xl focus:border-emerald-500 outline-none text-sm shadow-sm"
                          value={formData.vitals[v]}
                          onChange={(e) => setFormData({...formData, vitals: {...formData.vitals, [v]: e.target.value}})}
                        />
                      ))}
                    </div>
                  </div>

                  {/* CLINICAL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <textarea 
                      placeholder="Symptoms" 
                      className="border p-3 rounded-xl h-28 text-sm outline-none focus:border-emerald-500" 
                      value={formData.clinical.symptoms}
                      onChange={(e) => setFormData({...formData, clinical: {...formData.clinical, symptoms: e.target.value}})}
                    />
                    <textarea 
                      placeholder="Diagnosis" 
                      className="border p-3 rounded-xl h-28 text-sm outline-none focus:border-emerald-500" 
                      value={formData.clinical.diagnosis}
                      onChange={(e) => setFormData({...formData, clinical: {...formData.clinical, diagnosis: e.target.value}})}
                    />
                    <textarea 
                      placeholder="Advice" 
                      className="border p-3 rounded-xl h-28 text-sm outline-none focus:border-emerald-500" 
                      value={formData.clinical.advice}
                      onChange={(e) => setFormData({...formData, clinical: {...formData.clinical, advice: e.target.value}})}
                    />
                  </div>

                  {/* MEDICINES */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2"><Stethoscope size={14}/> Medicine Entry</h3>
                      <button onClick={addMedicine} className="p-2 bg-emerald-500 text-white rounded-full hover:rotate-90 transition-transform"><Plus size={16}/></button>
                    </div>
                    <div className="space-y-2">
                      <div className="overflow-x-auto">
                        <div className="grid grid-cols-8 gap-2 text-[10px] font-black uppercase tracking-wider text-slate-500 min-w-[820px] px-2">
                          <div className="col-span-2">Medicine Name</div>
                          <div>Dosage</div>
                          <div>Frequency</div>
                          <div>Duration</div>
                          <div className="col-span-2">Instructions</div>
                          <div className="text-center">Delete</div>
                        </div>
                      </div>
                      {formData.medicines.map((med, idx) => (
                        <div key={idx} className="overflow-x-auto">
                          <div className="grid grid-cols-8 gap-2 items-center bg-slate-50 p-2 rounded-xl border border-dashed border-slate-300 min-w-[820px]">
                            <input 
                              placeholder="Medicine Name" 
                              className="p-2 rounded-lg border text-sm col-span-2 outline-none focus:border-emerald-500" 
                              value={med.name}
                              onChange={(e) => {
                                 const updatedMeds = [...formData.medicines];
                                 updatedMeds[idx].name = e.target.value;
                                 setFormData({...formData, medicines: updatedMeds});
                              }}
                            />
                            <input 
                              placeholder="Dosage" 
                              className="p-2 rounded-lg border text-sm" 
                              value={med.dosage}
                              onChange={(e) => {
                                const updatedMeds = [...formData.medicines];
                                updatedMeds[idx].dosage = e.target.value;
                                setFormData({...formData, medicines: updatedMeds});
                              }}
                            />
                            <input 
                              placeholder="Frequency" 
                              className="p-2 rounded-lg border text-sm" 
                              value={med.frequency}
                              onChange={(e) => {
                                const updatedMeds = [...formData.medicines];
                                updatedMeds[idx].frequency = e.target.value;
                                setFormData({...formData, medicines: updatedMeds});
                              }}
                            />
                            <input 
                              placeholder="Duration" 
                              className="p-2 rounded-lg border text-sm" 
                              value={med.duration}
                              onChange={(e) => {
                                const updatedMeds = [...formData.medicines];
                                updatedMeds[idx].duration = e.target.value;
                                setFormData({...formData, medicines: updatedMeds});
                              }}
                            />
                            <textarea 
                              placeholder="Instructions" 
                              rows={1}
                              className="p-2 rounded-lg border text-sm col-span-2 resize-none h-10"
                              value={med.instructions}
                              onChange={(e) => {
                                const updatedMeds = [...formData.medicines];
                                updatedMeds[idx].instructions = e.target.value;
                                setFormData({...formData, medicines: updatedMeds});
                              }}
                            />
                            <button onClick={() => removeMedicine(idx)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg flex justify-center"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <div className="border-4 border-dashed border-slate-100 rounded-[30px] p-12 text-center flex flex-col items-center gap-4 group hover:border-emerald-200 transition">
                      <div className="relative">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-500 group-hover:text-white transition">
                          <Upload size={32} />
                        </div>
                        <label
                          htmlFor="fileUp"
                          className="absolute inset-0 rounded-2xl cursor-pointer opacity-0 group-hover:opacity-100 transition bg-emerald-500/90 text-white text-[10px] font-bold flex items-center justify-center"
                        >
                          Upload
                        </label>
                      </div>
                      <input type="file" className="hidden" id="fileUp" accept="image/*,application/pdf" onChange={handleFileChange} />
                      <label htmlFor="fileUp" className="cursor-pointer font-bold text-slate-500">
                        {uploading ? 'Uploading...' : 'Click to upload Prescription Image/PDF'}
                      </label>
                  </div>
                  {formData.uploadUrl && (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      {formData.uploadUrl.match(/\.(png|jpe?g|gif|webp)$/i) ? (
                        <img
                          src={`${API_BASE_URL}${formData.uploadUrl}`}
                          alt="Prescription"
                          className="max-h-72 w-full object-contain rounded-xl border bg-white"
                        />
                      ) : (
                        <a
                          href={`${API_BASE_URL}${formData.uploadUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-emerald-600 underline"
                        >
                          {uploadMeta?.name || 'View uploaded file'}
                        </a>
                      )}
                    </div>
                  )}
                  <textarea 
                    placeholder="Description..." 
                    className="w-full border p-4 rounded-[20px] h-32 text-sm outline-none focus:border-emerald-500" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="flex flex-wrap items-end gap-3 justify-between pt-6 border-t">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-extrabold uppercase text-emerald-600">Next Visit Date</label>
                  <input 
                    type="date" 
                    className="bg-white border p-2 rounded-xl text-sm"
                    value={formData.nextVisitDate}
                    onChange={(e) => setFormData({...formData, nextVisitDate: e.target.value})}
                  />
                </div>
                <button onClick={() => handleSave('save')} disabled={saving} className="flex items-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-slate-900 transition shadow-lg">
                  {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={18} />} 
                  {editingId ? 'Update Record' : 'Save Record'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Prescription;
