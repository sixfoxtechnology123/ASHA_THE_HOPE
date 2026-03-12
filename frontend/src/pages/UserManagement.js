import React, { useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';
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
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    <div className="page-shell">
      
      {/* FIXED HEADER */}
      <header className="page-header">
        <div className="header-card">
          <div className="header-row">
            <div className="header-icon">
              <UserPlus size={28} />
            </div>
            <div>
              <h1 className="header-title">User Management</h1>
              <p className="header-subtitle">Personnel Control</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-[color:var(--brand-600)] bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
            <ShieldCheck size={16} /> SECURE
          </div>
        </div>
      </header>

      {/* SCROLLABLE FORM AREA */}
      <section className="flex-1 overflow-y-auto px-4 md:px-6 pb-6 custom-scrollbar">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-6 flex flex-col items-center">
              <label className="field-label mb-4 uppercase">Photo</label>
              <div className="relative group">
                <div className="w-44 h-44 bg-slate-50 rounded-[50px] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-[color:var(--brand-500)] group-hover:bg-slate-50/30">
                  {formData.profilePhoto ? (
                    <img src={URL.createObjectURL(formData.profilePhoto)} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={48} className="text-slate-200" />
                  )}
                </div>
                <input type="file" id="photo" className="hidden" onChange={(e) => setFormData({...formData, profilePhoto: e.target.files[0]})} />
                <label htmlFor="photo" className="absolute -bottom-2 -right-2 p-4 bg-slate-900 text-white rounded-2xl cursor-pointer hover:bg-[color:var(--brand-500)] transition-all">
                  <Camera size={20} />
                </label>
              </div>
            </div>

            <div className="card p-6">
              <label className="field-label mb-4 block uppercase text-center">Status</label>
              <div className="flex justify-around">
                 <StatusOption label="ACTIVE" value="Active" current={formData.status} onChange={handleChange} color="text-[color:var(--success)]" />
                 <StatusOption label="INACTIVE" value="Inactive" current={formData.status} onChange={handleChange} color="text-[color:var(--danger)]" />
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-2 card p-8 md:p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
              <Input label="FULL NAME" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="NAME" />
              <Input label="MOBILE" name="mobile" value={formData.mobile} onChange={handleChange} placeholder="+91" />
              <Input label="EMAIL" name="email" value={formData.email} onChange={handleChange} type="email" placeholder="STAFF@ASHA.COM" />
              
              <div className="flex flex-col gap-2">
                <label className="field-label">Role</label>
                <select name="role" value={formData.role} onChange={handleChange} className="select-field uppercase">
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

            <button disabled={loading} className="mt-12 w-full py-2 btn-primary justify-center active:scale-95">
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
    <label className="field-label">{label}</label>
    <input required {...props} className="input-field uppercase placeholder:font-normal placeholder:text-slate-300" />
  </div>
);

const StatusOption = ({ label, value, current, onChange, color }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input type="radio" name="status" value={value} checked={current === value} onChange={onChange} className="w-4 h-4 text-[color:var(--brand-500)]" />
    <span className={`text-[10px] font-black tracking-widest ${color} group-hover:opacity-70 transition-opacity`}>{label}</span>
  </label>
);

export default UserManagement;
