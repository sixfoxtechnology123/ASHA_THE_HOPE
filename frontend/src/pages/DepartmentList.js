import React, { useState, useEffect } from 'react';
import { api } from '../config/api';
import { Layers, Plus, Search, Edit, Trash2, X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DepartmentList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ deptId: '', deptName: '' });

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/master/department/all`);
      if (res.data.success) setDepartments(res.data.data);
    } catch (err) { toast.error("Failed to load departments"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); }, []);

  // --- SEARCH LOGIC ---
  const filteredData = departments.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      item.deptName.toLowerCase().includes(search) || 
      item.deptId.toLowerCase().includes(search)
    );
  });

  const handleAddNew = async () => {
    setEditId(null);
    try {
      const res = await api.get(`/master/department/latest-id`);
      setFormData({ deptId: res.data.nextId, deptName: '' });
      setIsModalOpen(true);
    } catch (err) { toast.error("Error generating ID"); }
  };

  const handleEdit = (dept) => {
    setEditId(dept._id);
    setFormData({ deptId: dept.deptId, deptName: dept.deptName });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = editId ? { id: editId, ...formData } : formData;
      const res = await api.post(`/master/department/upsert`, payload);
      if (res.data.success) {
        toast.success(editId ? "Updated" : "Saved");
        setIsModalOpen(false);
        fetchDepartments();
      }
    } catch (err) { toast.error(err.response?.data?.message || "Error"); }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this department?")) {
      try {
        await api.delete(`/master/department/${id}`);
        toast.success("Deleted");
        fetchDepartments();
      } catch (err) { toast.error("Delete failed"); }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-semibold">
      <div className="relative z-10">
        <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur p-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border-b-4 border-emerald-500 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(14,165,164,0.6)]">
                <Layers size={18} />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Department Master</h1>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">Hospital Unit Management</p>
              </div>
            </div>
            <button onClick={handleAddNew} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600">
              <Plus size={18} /> Add Department
            </button>
          </div>
        </header>

        <main className="px-6 pb-12">
          <div className="max-w-7xl mx-auto space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Search departments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 pl-10 text-[11px] font-bold uppercase tracking-wide outline-none focus:border-emerald-500"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[720px] text-left">
                <thead>
                  <tr className="bg-white text-left text-[10px] font-extrabold uppercase tracking-[0.14em] text-emerald-600">
                    <th className="p-2 px-8">Dept ID</th>
                    <th className="p-2">Department Name</th>
                    <th className="p-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="3" className="p-12 text-center text-slate-400 font-medium">Syncing...</td></tr>
                  ) : filteredData.length > 0 ? (
                    filteredData.map((dept) => (
                      <tr key={dept._id} className="border-b border-slate-100 text-[13px] font-bold text-slate-600 hover:bg-slate-50/50 transition-colors">
                        <td className="p-1 px-8 font-semibold text-emerald-600 text-sm uppercase">{dept.deptId}</td>
                        <td className="p-1 font-medium text-slate-700 uppercase text-sm">{dept.deptName}</td>
                        <td className="p-1 flex justify-center gap-3">
                          <button onClick={() => handleEdit(dept)} className="rounded-xl bg-slate-100 p-2 text-emerald-600 transition hover:bg-emerald-600 hover:text-white"><Edit size={16}/></button>
                          <button onClick={() => handleDelete(dept._id)} className="rounded-xl bg-rose-100 p-2 text-rose-600 transition hover:bg-rose-600 hover:text-white"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr><td colSpan="3" className="p-12 text-center text-slate-300 font-medium uppercase text-xs">No matching records found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* POPUP MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <form onSubmit={handleSubmit} className="relative bg-white w-full max-w-md px-8 py-5 rounded-[40px] shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-800 uppercase tracking-tight">{editId ? 'Edit Dept' : 'New Dept'}</h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-full text-slate-400"><X size={20}/></button>
            </div>
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600"> Assigned ID</label>
                <input type="text" value={formData.deptId} readOnly className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Department Name</label>
                <input 
                  required type="text" value={formData.deptName} autoFocus
                  onChange={(e) => setFormData({...formData, deptName: e.target.value.toUpperCase()})}
                  placeholder="E.G. RADIOLOGY"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500"
                />
              </div>
              <button disabled={isSaving} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600 active:scale-95">
                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                {editId ? 'UPDATE CHANGES' : 'SAVE DEPARTMENT'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DepartmentList;
