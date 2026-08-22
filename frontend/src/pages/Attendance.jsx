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
  UserCheck,
  Loader2,
  Check
} from 'lucide-react';
import { Modal } from '../components/common/Modal.jsx';

export const Attendance = () => {
  const { user } = useAuth();
  const rawRole = (user?.role || '').toUpperCase();
  const isStudent = rawRole === 'STUDENT';
  const canMarkAttendance = rawRole === 'FACULTY' || rawRole === 'ADMIN' || rawRole === 'SUPER_ADMIN' || rawRole === 'DEAN' || rawRole === 'HOD';

  const [logs, setLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successNotice, setSuccessNotice] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    course_code: 'CS201',
    student_id: '',
    student_name: 'Alex Rivera',
    status: 'PRESENT',
    department: user?.department || 'Computer Science'
  });

  const [mcpResult, setMcpResult] = useState(null);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const [attRes, stuRes, subRes] = await Promise.allSettled([
        api.get('/attendance'),
        api.get('/students'),
        api.get('/subjects')
      ]);

      if (attRes.status === 'fulfilled') {
        setLogs(attRes.value.logs || []);
        setAlerts(attRes.value.thresholdAlerts || []);
      }
      if (stuRes.status === 'fulfilled') {
        const stuList = stuRes.value.students || [];
        setStudents(stuList);
        if (stuList.length > 0 && !form.student_id) {
          setForm(prev => ({
            ...prev,
            student_id: stuList[0].id,
            student_name: stuList[0].full_name,
            department: stuList[0].department || prev.department
          }));
        }
      }
      if (subRes.status === 'fulfilled') {
        setSubjects(subRes.value.subjects || []);
      }
    } catch (e) {
      console.warn('[Attendance] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleOpenModal = () => {
    if (students.length > 0 && !form.student_id) {
      setForm(prev => ({
        ...prev,
        student_id: students[0].id,
        student_name: students[0].full_name,
        department: students[0].department || 'Computer Science'
      }));
    }
    setIsModalOpen(true);
  };

  const handleStudentSelect = (e) => {
    const selectedId = e.target.value;
    const selectedStudent = students.find(s => s.id === selectedId);
    if (selectedStudent) {
      setForm(prev => ({
        ...prev,
        student_id: selectedStudent.id,
        student_name: selectedStudent.full_name,
        department: selectedStudent.department || prev.department
      }));
    } else {
      setForm(prev => ({ ...prev, student_id: selectedId, student_name: selectedId }));
    }
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const res = await api.post('/attendance', form);
      if (res && res.success) {
        setSuccessNotice(true);
        if (res.mcpAlertSent) {
          setMcpResult(res.mcpAlertSent);
        }
        setTimeout(() => {
          setSuccessNotice(false);
          setIsModalOpen(false);
        }, 500);
        await fetchAttendance();
      }
    } catch (err) {
      console.error('[Attendance] Submit error:', err);
      alert(err.message || 'Error logging attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const studentName = user?.full_name || 'Student';

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
  const presentCount = displayLogs.filter(l => (l.status || '').toUpperCase() === 'PRESENT').length;
  const absentCount = displayLogs.filter(l => (l.status || '').toUpperCase() === 'ABSENT').length;
  const attendanceRate = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(1) : '95.0';

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
              ? 'Review your logged attendance records, compliance flags, and active notifications.'
              : 'Real-time participation tracking, policy alerts (<75% threshold), and compliance verification.'}
          </p>
        </div>

        {canMarkAttendance && (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Log Class Attendance Entry
          </button>
        )}
      </div>

      {/* Threshold Warning Banner */}
      {studentAlerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Policy 4.2 Attendance Threshold Alerts ({studentAlerts.length} Students At Risk)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
            {studentAlerts.slice(0, 3).map((a, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">{a.student_name}</span>
                  <span className="text-[10px] text-slate-400">{a.department}</span>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-rose-400 block">{a.attendance_rate}%</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold">
                    {a.warning_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Total Classes Tracked</p>
            <p className="text-xl font-bold text-white">{totalClasses}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Present Entries</p>
            <p className="text-xl font-bold text-emerald-400">{presentCount}</p>
          </div>
        </div>

        <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400">
            <XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Absences Recorded</p>
            <p className="text-xl font-bold text-rose-400">{absentCount}</p>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-outfit">
            Historical Attendance Log ({displayLogs.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Synced with University Attendance Ledger
          </span>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 text-xs py-12 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span>Loading attendance records...</span>
          </div>
        ) : displayLogs.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-12">No attendance logs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {displayLogs.map((log) => {
                  const isPres = (log.status || '').toUpperCase() === 'PRESENT';
                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="p-3 text-slate-400 font-mono">
                        {log.date ? new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                      </td>
                      <td className="p-3 font-semibold text-blue-400">{log.course_code || 'CS201'}</td>
                      <td className="p-3 font-bold text-white">{log.student_name}</td>
                      <td className="p-3 text-slate-400">{log.department || 'Computer Science'}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                          isPres
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        }`}>
                          {isPres ? 'PRESENT' : 'ABSENT'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Attendance Entry Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log Attendance Record">
        <form onSubmit={handleLogSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Student</label>
            {students.length > 0 ? (
              <select
                value={form.student_id || (students[0]?.id || '')}
                onChange={handleStudentSelect}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              >
                {students.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.student_id_number || s.student_code}) - {s.department}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                required
                value={form.student_name}
                onChange={(e) => setForm({ ...form, student_name: e.target.value })}
                placeholder="Enter student name..."
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Course Code</label>
              <select
                value={form.course_code}
                onChange={(e) => setForm({ ...form, course_code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
              >
                {subjects.length > 0 ? (
                  subjects.map(sb => (
                    <option key={sb.id} value={sb.subject_code}>{sb.subject_code} - {sb.name}</option>
                  ))
                ) : (
                  <>
                    <option value="CS201">CS201 - Data Structures</option>
                    <option value="CS202">CS202 - DBMS</option>
                    <option value="ECE201">ECE201 - Digital Signal Processing</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Attendance Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-blue-500 outline-none"
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
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-lg shadow-blue-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Logging...</span>
                </>
              ) : successNotice ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Logged!</span>
                </>
              ) : (
                <span>Submit & Check Thresholds</span>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
