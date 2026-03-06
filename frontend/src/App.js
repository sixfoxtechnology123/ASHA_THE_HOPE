import React from "react";
import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// --- IMPORT COMPONENTS ---
import Sidebar from "./components/Sidebar";


import Login from "./loginPages/Login";
import UserManagement from "./pages/UserManagement";
import DoctorRegistration from "./pages/DoctorRegistration";
import DoctoreSchedule from "./pages/DoctoreSchedule";
import AppointmentBooking from "./pages/AppointmentBooking";
import PatientsRegistration from "./pages/PatientsRegistration";
import DoctorSpecialization from "./master/DoctorSpecialization";
import DoctorSpecializationList from "./master/DoctorSpecializationList";
import DepartmentList from "./pages/DepartmentList";

export default function App() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Toaster position="top-right" />

      <Routes>
        {/* 1. Login Route: No Sidebar, Full Screen */}
        <Route path="/" element={<Login />} />

        {/* 2. All Protected Routes: With Sidebar Layout */}
        <Route
          path="*"
          element={
            <div className="flex h-screen overflow-hidden">
              {/* FIXED SIDEBAR */}
              <Sidebar />

              {/* MAIN CONTENT AREA */}
              {/* lg:ml-64 ensures content doesn't go under the sidebar on desktop */}
              <main className="flex-1 lg:ml-64 flex flex-col h-screen overflow-hidden">
                <div className="flex-1 overflow-y-auto pt-16 lg:pt-0">
                  <Routes>
                    <Route path="/UserManagement" element={<UserManagement />} />
                    <Route path="/DoctorRegistration" element={<DoctorRegistration />} />
                    <Route path="/DoctoreSchedule" element={<DoctoreSchedule />} />
                    <Route path="/AppointmentBooking" element={<AppointmentBooking />} />
                    <Route path="/PatientsRegistration" element={<PatientsRegistration />} />
                    <Route path="/DoctorSpecialization" element={<DoctorSpecialization />} />
                    <Route path="/DoctorSpecializationList" element={<DoctorSpecializationList />} />
                    <Route path="/DepartmentList" element={<DepartmentList/>} />
                  </Routes>
                </div>
              </main>
            </div>
          }
        />
      </Routes>
    </div>
  );
}
