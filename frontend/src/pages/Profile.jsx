import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  UserCheck,
  Shield,
  Mail,
  Building,
  Bell,
  Key,
  Save,
  CheckCircle2
} from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  const [saved, setSaved] = useState(false);
  const [notifications, setNotifications] = useState({
    attendanceWarnings: true,
    riskEscalations: true,
    weeklyDigest: false
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
          <UserCheck className="w-6 h-6 text-blue-500" />
          User Credentials & Platform Preferences
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage your role privileges, department affiliations, and alert dispatch parameters.
        </p>
      </div>

      {saved && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Profile configuration successfully updated.</span>
        </div>
      )}

      {/* User Card */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex items-center gap-5">
        <img
          src={user?.avatar_url || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150'}
          alt={user?.full_name}
          className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/40"
        />
        <div>
          <h2 className="text-lg font-bold text-white font-outfit">{user?.full_name}</h2>
          <p className="text-xs text-blue-400 font-semibold">{user?.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
              Role: {user?.role}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Dept: {user?.department || 'Computer Science'}
            </span>
          </div>
        </div>
      </div>

      {/* Notification Preferences */}
      <form onSubmit={handleSave} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-400" />
          Automated Notification Preferences
        </h3>

        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <div className="font-bold text-white">Attendance Threshold Alerts (&lt;75%)</div>
              <div className="text-[11px] text-slate-400">Receive instant MCP email dispatches when attendance falls below threshold</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.attendanceWarnings}
              onChange={(e) => setNotifications({ ...notifications, attendanceWarnings: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-700"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 cursor-pointer">
            <div>
              <div className="font-bold text-white">Student Predictive Risk Trajectory Escalations</div>
              <div className="text-[11px] text-slate-400">Notify when Gemini recalculates a student to HIGH Risk</div>
            </div>
            <input
              type="checkbox"
              checked={notifications.riskEscalations}
              onChange={(e) => setNotifications({ ...notifications, riskEscalations: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded bg-slate-950 border-slate-700"
            />
          </label>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-800">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Save className="w-4 h-4" />
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
};
