import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { Layers, Save, ShieldCheck, Loader2, RefreshCw, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorSpecialization = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    specId: 'SP0001', // Default starting point
    specName: ''
  });

  // Fetch the latest ID from the database to ensure SP sequence is correct
  const fetchLatestID = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/master/specialization/latest`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.data.success && res.data.lastId) {
        // Extract number from SP0001, increment, and re-format
        const lastNum = parseInt(res.data.lastId.replace('SP', ''));
        const nextID = `SP${String(lastNum + 1).padStart(4, '0')}`;
        setFormData(prev => ({ ...prev, specId: nextID }));
      }
    } catch (err) {
      console.error("Error generating next ID");
    }
  };

  useEffect(() => {
    fetchLatestID();
  }, []);

  const handleChange = (e) => {
    // Force uppercase for consistent master data entry
    setFormData({ ...formData, specName: e.target.value.toUpperCase() });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/master/specialization`, formData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        toast.success("SPECIALIZATION SAVED SUCCESSFULLY");
        setFormData({ specId: '', specName: '' }); 
        fetchLatestID(); // Generate next ID for the next entry
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "SYSTEM ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-w-0 font-sans">
      
      {/* HEADER SECTION */}
      <header className="p-4 md:p-6">
        <div className="bg-white p-6 md:p-8 rounded-[35px] border border-slate-200 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-xl shadow-blue-400/20">
              <Layers size={32} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">Specialization Master</h1>
              <p className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase mt-1">Add Medical Category</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-5 py-2.5 rounded-full border border-blue-100">
            <ShieldCheck size={16} /> MASTER ENTRY ACTIVE
          </div>
        </div>
      </header>

      {/* FORM SECTION */}
      <section className="flex-1 flex items-center justify-center p-4 md:p-6">
        <div className="w-full max-w-4xl">
          <form onSubmit={handleSubmit} className="bg-white p-10 md:p-16 rounded-[50px] border border-slate-200 shadow-sm relative overflow-hidden group">
            
            {/* Background Decoration */}
            <Layers size={200} className="absolute -right-20 -bottom-20 text-slate-50 rotate-12 transition-transform group-hover:scale-110 duration-700" />

            <div className="relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                
                {/* AUTO GENERATED ID (Read Only) */}
                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-black text-slate-400 tracking-[0.2em] uppercase flex items-center gap-2">
                    <Hash size={14} /> System Assigned ID
                  </label>
                  <input 
                    type="text" 
                    value={formData.specId} 
                    readOnly 
                    className="w-full py-4 bg-slate-50 border-b-2 border-slate-200 font-black text-2xl text-blue-600 outline-none px-4 rounded-xl shadow-inner cursor-not-allowed"
                  />
                </div>

                {/* SPECIALIZATION NAME */}
                <div className="flex flex-col gap-3">
                  <label className="text-[11px] font-black text-slate-900 tracking-[0.2em] uppercase">Specialization Name</label>
                  <input 
                    required
                    type="text" 
                    name="specName"
                    value={formData.specName}
                    onChange={handleChange}
                    placeholder="E.G. NEUROLOGY"
                    className="w-full py-4 border-b-2 border-slate-100 font-black text-2xl outline-none focus:border-blue-600 bg-transparent placeholder:font-normal placeholder:text-slate-200 uppercase"
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="mt-16 md:mt-24 flex flex-col sm:flex-row gap-6">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, specName: ''})}
                  className="flex-1 py-5 bg-slate-50 hover:bg-slate-100 text-slate-400 font-black rounded-3xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs border border-slate-100"
                >
                  <RefreshCw size={20} /> Reset
                </button>

                <button 
                  disabled={loading}
                  type="submit" 
                  className="flex-[2] py-5 bg-[#0F172A] hover:bg-blue-600 text-white font-black rounded-3xl transition-all shadow-2xl shadow-blue-900/20 flex items-center justify-center gap-4 uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                  Save Category
                </button>
              </div>
            </div>

          </form>
        </div>
      </section>
    </div>
  );
};

export default DoctorSpecialization;
