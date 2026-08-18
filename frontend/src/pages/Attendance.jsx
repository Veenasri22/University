import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  CalendarCheck,
  AlertTriangle,
  Mail,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Modal } from '../components/common/Modal.jsx';

export const Attendance = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT' || user?.role === 'Student';
  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    course_code: 'CS201',
    student_name: user?.full_name || 'Alex Rivera',
    status: 'ABSENT',
    department: user?.department || 'Computer Science'
  });

  const [mcpResult, setMcpResult] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance');
      setLogs(res.logs || []);
      setAlerts(res.thresholdAlerts || []);
    } catch (e) {
      console.warn('[Attendance] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/attendance', form);
      setIsModalOpen(false);
      if (res.mcpAlertSent) {
        setMcpResult(res.mcpAlertSent);
      }
      fetchAttendance();
    } catch (err) {
      alert(err.message || 'Error logging attendance');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <CalendarCheck className="w-6 h-6 text-blue-500" />
            {isStudent ? 'My Attendance & Compliance Records' : 'Attendance Analytics & Compliance Thresholds'}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {isStudent
              ? `Personal participation records for ${user?.full_name || 'Student'} (${user?.department || 'Computer Science'}). Keep above 75% threshold.`
              : 'Real-time participation tracking and automated threshold alert warnings (<75% attendance).'}
          </p>
        </div>

        {!isStudent ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Log Class Attendance Entry
          </button>
        ) : (
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Attendance Status: Good Standing (&gt;75%)</span>
          </div>
        )}
      </div>

      {/* MCP Notification Success Banner */}
      {mcpResult && (
        <div className="glass-panel rounded-2xl p-4 border border-rose-500/30 bg-rose-950/20 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">MCP Gmail Connector Triggered</h4>
              <p className="text-[11px] text-slate-300">
                Automated threshold email dispatched to <strong>{mcpResult.recipient}</strong> (Status: {mcpResult.status})
              </p>
            </div>
          </div>
          <button onClick={() => setMcpResult(null)} className="text-xs font-bold text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Active Threshold Alerts Grid */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Active Threshold Warning Logs (&lt;75% Attendance)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {alerts.length === 0 ? (
            <div className="col-span-2 text-xs text-slate-400">No active compliance warnings. All students exceed 75% attendance threshold.</div>
          ) : (
            alerts.map((alt) => (
              <div key={alt.student_id} className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-white">{alt.student_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                      {alt.warning_level}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{alt.department} • Attendance Rate: <strong className="text-rose-400">{alt.attendance_rate}%</strong></p>
                </div>
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-300">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Attendance History Logs Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 font-bold text-sm text-white">Recent Attendance Logs</div>
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 uppercase text-[10px] font-bold text-slate-400 border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Student</th>
              <th className="px-6 py-3.5">Course Code</th>
              <th className="px-6 py-3.5">Department</th>
              <th className="px-6 py-3.5">Date</th>
              <th className="px-6 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-850/50">
                <td className="px-6 py-3 font-bold text-white">{log.student_name}</td>
                <td className="px-6 py-3 font-semibold text-blue-400">{log.course_code}</td>
                <td className="px-6 py-3 text-slate-400">{log.department}</td>
                <td className="px-6 py-3 text-slate-400">{log.date}</td>
                <td className="px-6 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    log.status === 'PRESENT' || log.status === 'Present' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}>
                    {log.status === 'Present' ? 'PRESENT' : log.status === 'Absent' ? 'ABSENT' : log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Log Attendance Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Attendance Record">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Student Name</label>
            <input
              type="text"
              required
              value={form.student_name}
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Course Code</label>
              <input
                type="text"
                required
                value={form.course_code}
                onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Attendance Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500"
            >
              Submit & Check Thresholds
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
