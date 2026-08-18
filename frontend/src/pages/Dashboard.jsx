import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { AdminDashboard } from '../components/dashboards/AdminDashboard.jsx';
import { HodDashboard } from '../components/dashboards/HodDashboard.jsx';
import { FacultyDashboard } from '../components/dashboards/FacultyDashboard.jsx';
import { StudentDashboard } from '../components/dashboards/StudentDashboard.jsx';
import { Shield, Users, GraduationCap, Building2, UserCheck } from 'lucide-react';

export const Dashboard = () => {
  const { user } = useAuth();
  const userRole = (user?.role || 'STUDENT').toUpperCase();

  const [activeTab, setActiveTab] = useState(() => {
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') return 'ADMIN';
    if (userRole === 'HOD') return 'HOD';
    if (userRole === 'FACULTY') return 'FACULTY';
    return 'STUDENT';
  });

  return (
    <div className="space-y-6">
      {/* Top Role Selector (for Admin/HOD/Faculty) */}
      {userRole !== 'STUDENT' && (
        <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2 rounded-2xl">
          <span className="text-xs font-bold text-slate-400 pl-2 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-blue-400" /> Active View Mode:
          </span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl">
            {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') && (
              <button
                onClick={() => setActiveTab('ADMIN')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'ADMIN' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin Dashboard
              </button>
            )}
            {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HOD') && (
              <button
                onClick={() => setActiveTab('HOD')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'HOD' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                HOD Portal
              </button>
            )}
            {(userRole === 'ADMIN' || userRole === 'SUPER_ADMIN' || userRole === 'HOD' || userRole === 'FACULTY') && (
              <button
                onClick={() => setActiveTab('FACULTY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'FACULTY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Faculty Workstation
              </button>
            )}
            <button
              onClick={() => setActiveTab('STUDENT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'STUDENT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              Student View
            </button>
          </div>
        </div>
      )}

      {/* Render Selected Spec Dashboard */}
      {activeTab === 'ADMIN' && <AdminDashboard />}
      {activeTab === 'HOD' && <HodDashboard />}
      {activeTab === 'FACULTY' && <FacultyDashboard />}
      {activeTab === 'STUDENT' && <StudentDashboard />}
    </div>
  );
};
