import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Layers, Search, Trash2, Edit, Loader2, Plus, RefreshCw, X, Hash, Save } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorSpecializationList = () => {
  const [specializations, setSpecializations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // MODAL STATES
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState(null); // Tracks MongoDB _id for updates
  const [formData, setFormData] = useState({ specId: '', specName: '' });

  // 1. FETCH DATA
  const fetchSpecializations = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/master/specialization/all`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setSpecializations(res.data.data);
      }
    } catch (err) {
      toast.error("FAILED TO LOAD DATABASE");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSpecializations(); }, []);

  // 2. OPEN MODAL FOR NEW (Strictly next ID logic)
  const handleAddNew = async () => {
    setEditId(null); // Ensure we are NOT in edit mode
    try {
      const res = await axios.get(`${API_BASE_URL}/api/master/specialization/latest`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success) {
        setFormData({ specId: res.data.nextId, specName: '' });
        setIsModalOpen(true);
      }
    } catch (err) {
      toast.error("ERROR GENERATING NEXT ID");
    }
  };

  // 3. OPEN MODAL FOR EDIT (Population logic)
  const handleEdit = (item) => {
    setEditId(item._id); // Store the record ID
    setFormData({ specId: item.specId, specName: item.specName });
    setIsModalOpen(true);
  };

  // 4. SAVE OR UPDATE (Upsert Logic)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Use the 'upsert' route or choose based on editId
      const payload = editId ? { id: editId, ...formData } : formData;
      const res = await axios.post(`${API_BASE_URL}/api/master/specialization/upsert`, payload, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      if (res.data.success) {
        toast.success(editId ? "RECORD UPDATED" : "RECORD SAVED");
        setIsModalOpen(false);
        fetchSpecializations(); // Refresh list
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "OPERATION FAILED");
    } finally {
      setIsSaving(false);
    }
  };

  // 5. DELETE
  const handleDelete = async (id) => {
    if (window.confirm("ARE YOU SURE YOU WANT TO DELETE THIS?")) {
      try {
        await axios.delete(`${API_BASE_URL}/api/master/specialization/${id}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success("DELETED SUCCESSFULLY");
        fetchSpecializations();
      } catch (err) { toast.error("DELETE FAILED"); }
    }
  };

  const filteredData = specializations.filter(item => 
    item.specName.toLowerCase().includes(searchTerm.toLowerCase()) || item.specId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-w-0 font-sans relative">
      <header className="p-2 md:p-3 space-y-2">
        <div className="bg-white px-4 py-2 rounded-[24px] border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-2 bg-[#0F172A] rounded-2xl text-white shadow-xl">
              <Layers size={14}/>
            </div>
            <h1 className="text-xl md:text-xl font-black text-slate-900 tracking-tighter uppercase leading-none">Specialization</h1>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={fetchSpecializations} className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 transition-all active:scale-95">
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={handleAddNew}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl font-black text-xs md:text-sm shadow-lg uppercase tracking-widest transition-all"
            >
              <Plus size={14} strokeWidth={3} />
              <span>Add New</span>
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" placeholder="SEARCH RECORDS..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-2 bg-white border-2 border-slate-100 rounded-[20px] font-black text-sm outline-none focus:border-blue-600 uppercase transition-all"
          />
        </div>
      </header>

      <section className="flex-1 overflow-y-auto px-4 md:px-6 pb-6">
        <div className="bg-white rounded-[14px] border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#0F172A] text-white">
                <th className="p-3 font-black tracking-widest text-[10px] uppercase">ID</th>
                <th className="p-3 font-black tracking-widest text-[10px] uppercase">Specialization Name</th>
                <th className="p-3 font-black tracking-widest text-[10px] uppercase text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="3" className="p-20 text-center font-black text-slate-400 uppercase">Syncing Database...</td></tr>
              ) : filteredData.length > 0 ? (
                filteredData.map((item) => (
                  <tr key={item._id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-3 font-black text-blue-600 text-xs">{item.specId}</td>
                    <td className="p-3 font-black text-slate-800 text-xs uppercase tracking-tight">{item.specName}</td>
                    <td className="p-3 flex justify-center gap-3">
                      <button onClick={() => handleEdit(item)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                        <Edit size={18} />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="p-2 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="3" className="p-20 text-center font-black text-slate-300 uppercase tracking-tighter text-xl">No Records Found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL (Handles both Add and Update) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[#0F172A]/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form 
            onSubmit={handleSubmit}
            className="relative bg-white w-full max-w-xl p-10 rounded-[40px] shadow-2xl animate-in zoom-in duration-300"
          >
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">
                {editId ? "Update Category" : "New Specialization"}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-8">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-slate-900 tracking-widest uppercase flex items-center gap-2"><Hash size={14}/> ID Code</label>
                <input type="text" value={formData.specId} readOnly className="w-full py-2 bg-slate-50 border-b-2 border-slate-200 font-black text-xl text-blue-600 px-4 rounded-xl outline-none" />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-slate-900 tracking-widest uppercase">Name</label>
                <input 
                  required type="text" value={formData.specName} autoFocus
                  onChange={(e) => setFormData({...formData, specName: e.target.value.toUpperCase()})}
                  className="w-full py-2 border-b-2 border-slate-100 font-black text-xl outline-none focus:border-blue-600 uppercase"
                />
              </div>

              <button disabled={isSaving} className="w-full py-3 bg-[#0F172A] hover:bg-blue-600 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                {editId ? "UPDATE RECORD" : "SAVE RECORD"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorSpecializationList;
