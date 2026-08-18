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

  const studentName = user?.full_name || 'Student';
  const studentDept = user?.department || 'Computer Science';

  // Filter logs for logged-in student
  const studentLogs = logs.filter(
    l => l.student_name?.toLowerCase() === studentName.toLowerCase() ||
         l.student_id === user?.id ||
         l.email === user?.email
  );

  const displayLogs = isStudent ? studentLogs : logs;

  // Filter threshold alerts for logged-in student
  const studentAlerts = isStudent
    ? alerts.filter(a => a.student_name?.toLowerCase() === studentName.toLowerCase() || a.student_id === user?.id)
    : alerts;

  // Calculate personal metrics for student view
  const totalClasses = displayLogs.length;
  const presentCount = displayLogs.filter(l => l.status === 'PRESENT' || l.status === 'Present').length;
  const absentCount = displayLogs.filter(l => l.status === 'ABSENT' || l.status === 'Absent').length;
  const attendanceRate = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : '90.0';

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
              ? `Personal participation records for ${studentName} (${studentDept}). Keep above 75% threshold.`
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
            <span>Status: Good Standing ({attendanceRate}%)</span>
          </div>
        )}
      </div>

      {/* Student Personal Attendance Metrics Bar */}
      {isStudent && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Rate</span>
            <div className="text-xl font-extrabold text-emerald-400">{attendanceRate}%</div>
            <p className="text-[10px] text-slate-400">Target: &gt;75% required</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Present Sessions</span>
            <div className="text-xl font-extrabold text-white">{presentCount}</div>
            <p className="text-[10px] text-emerald-400 font-semibold">Attended</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Absent Sessions</span>
            <div className="text-xl font-extrabold text-rose-400">{absentCount}</div>
            <p className="text-[10px] text-rose-400 font-semibold">Missed</p>
          </div>
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Tracked</span>
            <div className="text-xl font-extrabold text-blue-400">{totalClasses}</div>
            <p className="text-[10px] text-slate-400">Classes</p>
          </div>
        </div>
      )}

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
          {isStudent ? 'My Threshold Warning Alerts (<75%)' : 'Active Threshold Warning Logs (<75% Attendance)'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {studentAlerts.length === 0 ? (
            <div className="col-span-2 text-xs text-slate-400 flex items-center gap-2 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20 text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              {isStudent
                ? `No attendance warnings for ${studentName}. Your current attendance rate (${attendanceRate}%) meets university standards.`
                : 'No active compliance warnings. All students exceed 75% attendance threshold.'}
            </div>
          ) : (
            studentAlerts.map((alt) => (
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
        <div className="px-6 py-4 border-b border-slate-800 font-bold text-sm text-white flex items-center justify-between">
          <span>{isStudent ? `Attendance Records for ${studentName}` : 'Recent Attendance Logs'}</span>
          {isStudent && <span className="text-xs text-blue-400 font-normal">{studentDept}</span>}
        </div>
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
            {displayLogs.map((log) => (
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
