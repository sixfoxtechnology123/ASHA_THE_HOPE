import React, { useState } from 'react';
import { api } from '../config/api';
import { UserPlus, Save, Camera, ShieldCheck, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '', mobile: '', email: '', role: 'Receptionist',
    username: '', password: '', status: 'Active', profilePhoto: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));

    try {
      const response = await api.post(`/auth/register`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      if (response.data.success) {
        toast.success("USER CREATED");
        setFormData({ fullName: '', mobile: '', email: '', role: 'Receptionist', username: '', password: '', status: 'Active', profilePhoto: null });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "ERROR");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-semibold">
      
      {/* FIXED HEADER */}
      <header className="sticky top-0 z-20 bg-slate-50/90 backdrop-blur p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 rounded-3xl border-b-4 border-emerald-500 bg-white p-4 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_10px_20px_-10px_rgba(14,165,164,0.6)]">
              <UserPlus size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-600">Personnel Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-[10px] font-black text-emerald-600">
            <ShieldCheck size={16} /> SECURE
          </div>
        </div>
      </header>

      {/* SCROLLABLE FORM AREA */}
      <section className="flex-1 overflow-y-auto px-4 pb-6 md:px-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-4">
            <div className="mx-auto flex flex-col items-center rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
              <label className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Photo</label>
              <div className="relative group">
                <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-[50px] border-2 border-dashed border-slate-200 bg-slate-50 transition-all group-hover:border-emerald-500 group-hover:bg-slate-50/30">
                  {formData.profilePhoto ? (
                    <img src={URL.createObjectURL(formData.profilePhoto)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={48} className="text-slate-200" />
                  )}
                </div>
                <input type="file" id="photo" className="hidden" onChange={(e) => setFormData({...formData, profilePhoto: e.target.files[0]})} />
                <label htmlFor="photo" className="absolute -bottom-2 -right-2 cursor-pointer rounded-2xl bg-slate-900 p-4 text-white transition-all hover:bg-emerald-500">
                  <Camera size={20} />
                </label>
              </div>
            </div>

            <div className="mx-auto rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)]">
              <label className="mb-4 block text-center text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Status</label>
              <div className="flex justify-around">
                 <StatusOption label="ACTIVE" value="Active" current={formData.status} onChange={handleChange} color="text-emerald-600" />
                 <StatusOption label="INACTIVE" value="Inactive" current={formData.status} onChange={handleChange} color="text-rose-600" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.35)] md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <Input label="FULL NAME" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="NAME" />
              <Input label="MOBILE" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+91" />
              <Input label="EMAIL" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="STAFF@ASHA.COM" />
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none focus:border-emerald-500">
                  <option value="Admin">Admin</option>
                  <option value="Doctor">Doctor</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Pharmacy Manager">Pharmacy Manager</option>
                </select>
              </div>

              <Input label="USERNAME" name="username" value={formData.username} onChange={handleChange} placeholder="USER ID" />
              <Input label="PASSWORD" name="password" value={formData.password} onChange={handleChange} type="password" placeholder="••••" />
            </div>

            <button disabled={loading} className="mt-12 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-600 active:scale-95 disabled:opacity-60">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={24} />}
              SAVE PERSONNEL
            </button>
          </div>

        </form>
      </section>
    </div>
  );
};

// HELPER COMPONENTS
const Input = ({ label, ...props }) => (
  <div className="flex flex-col gap-2">
    <label className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-emerald-600">{label}</label>
    <input required {...props} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold uppercase outline-none placeholder:font-normal placeholder:text-slate-300 focus:border-emerald-500" />
  </div>
);

const StatusOption = ({ label, value, current, onChange, color }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input type="radio" name="status" value={value} checked={current === value} onChange={onChange} className="h-4 w-4 text-emerald-500" />
    <span className={`text-[10px] font-black tracking-widest ${color} group-hover:opacity-70 transition-opacity`}>{label}</span>
  </label>
);

export default UserManagement;
