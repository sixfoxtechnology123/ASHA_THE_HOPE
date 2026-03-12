import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Activity, LogOut, Menu, Stethoscope, ChevronDown, ChevronRight, Layers, CalendarDays, UserPlus, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [masterOpen, setMasterOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    toast.success("Successfully Logged Out");
    navigate("/");
  };

  const navLink = (path, name, icon) => {
    const isActive = location.pathname === path;
    return (
      <Link
        to={path}
        onClick={() => setOpen(false)}
        className={`flex items-center gap-4 rounded-2xl px-5 py-3.5 text-sm font-bold transition ${
          isActive
            ? 'bg-emerald-500/15 text-white shadow-[0_20px_25px_-20px_rgba(14,165,164,0.6)]'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
        }`}
      >
        <span className={isActive ? 'text-white' : 'text-slate-500'}>{icon}</span>
        {name}
      </Link>
    );
  };

  return (
    <>
      {/* MOBILE BAR - Deep Charcoal */}
      <div className="fixed top-0 inset-x-0 z-50 flex h-16 items-center justify-between bg-slate-900 px-6 shadow-xl lg:hidden">
        <span className="text-xl font-bold tracking-tighter text-white">ASHA HOPE</span>
        <button onClick={() => setOpen(true)} className="text-white bg-slate-800 p-2 rounded-lg">
          <Menu size={24} />
        </button>
      </div>

      {/* THE SIDEBAR */}
      <div className={`
        fixed inset-y-0 left-0 z-[60] flex w-64 flex-col border-r border-slate-900/40 bg-slate-900 text-slate-200 transition-transform duration-300
        ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0
      `}>
        {/* BRAND SECTION */}
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500 p-2.5 text-white shadow-lg shadow-emerald-500/20">
              <Activity size={24} />
            </div>
            <div>
              <span className="text-white font-bold text-xl tracking-tighter block leading-none">ASHA HOPE</span>
              <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Healthcare</span>
            </div>
          </div>
        </div>

        {/* NAVIGATION AREA */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Operations</p>
          
          {/* MASTER DROPDOWN */}
          <div className="space-y-1">
            <button
              onClick={() => setMasterOpen(!masterOpen)}
              className={`w-full flex items-center justify-between px-5 py-3.5 rounded-2xl text-sm font-bold transition-all group ${
                masterOpen ? 'bg-emerald-500/10 text-white' : 'text-slate-400 hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <Layers size={20} className={masterOpen ? 'text-white' : 'text-slate-500 group-hover:text-white'} />
                <span>Master Setup</span>
              </div>
              {masterOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${masterOpen ? 'max-h-20 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              {/* <Link 
                to="/DoctorSpecializationList" 
                className={`ml-12 py-2.5 block text-xs font-bold transition-colors ${
                    location.pathname === '/DoctorSpecializationList' ? 'text-emerald-400' : 'text-slate-500 hover:text-emerald-400'
                }`}
              >
                Specialization List
              </Link> */}
               <Link 
                to="/DepartmentList" 
                onClick={() => setOpen(false)}
                className={`ml-12 py-2.5 block text-xs font-bold transition-colors ${
                    location.pathname === '/DoctorSpecializationList' ? 'text-white' : 'text-slate-500 hover:text-white'
                }`}
              >
                Department
              </Link>

            </div>
          </div>

          {/* {navLink('/UserManagement', 'User Management', <UserCog size={20} />)} */}
          {navLink('/DoctorRegistration', 'Doctor Registration', <Stethoscope size={20} />)}
          {navLink('/DoctoreSchedule', 'Doctore Schedule', <CalendarDays size={20} />)}
          {navLink('/AppointmentBooking', 'Appointment Booking', <CalendarDays size={20} />)}
          {navLink('/PatientsRegistration', 'Patients Registration', <UserPlus size={20} />)}
          {navLink('/ConsultationBilling', 'Consultation Billing', <FileText size={20} />)}
        </nav>

        {/* LOGOUT SYSTEM */}
      <div className="bg-slate-800/80 p-4">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-slate-800/50 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-2xl transition-all text-xs font-bold uppercase tracking-widest border border-slate-700/50"
          >
            <LogOut size={16} />
            Logout Account
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
