import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';

const STATUS_CONFIG = {
  Present: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', btnBg: 'bg-emerald-600 hover:bg-emerald-500', label: 'P' },
  Absent: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', btnBg: 'bg-red-600 hover:bg-red-500', label: 'A' },
  Late: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', btnBg: 'bg-yellow-600 hover:bg-yellow-500', label: 'L' }
};

/**
 * AttendanceTable — High-density grid for bulk Present/Absent marking.
 *
 * Props:
 *   students: Array<{ id, full_name, student_code, department }>
 *   date: string (YYYY-MM-DD)
 *   initialRecords?: Record<studentId, 'Present'|'Absent'|'Late'>
 *   onSave: (records: Array<{ studentId, status }>) => Promise<void>
 *   disabled?: boolean
 *   loading?: boolean
 */
export const AttendanceTable = ({
  students = [],
  date,
  initialRecords = {},
  onSave,
  disabled = false,
  loading = false
}) => {
  const [records, setRecords] = useState(() => {
    const init = {};
    students.forEach(s => {
      init[s.id] = initialRecords[s.id] || 'Present';
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setRecords(updated);
    setSaved(false);
  };

  const toggleStudent = (studentId) => {
    setRecords(prev => {
      const current = prev[studentId];
      const cycle = { Present: 'Absent', Absent: 'Late', Late: 'Present' };
      return { ...prev, [studentId]: cycle[current] || 'Present' };
    });
    setSaved(false);
  };

  const setStudentStatus = (studentId, status) => {
    setRecords(prev => ({ ...prev, [studentId]: status }));
    setSaved(false);
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      const payload = Object.entries(records).map(([studentId, status]) => ({ studentId, status }));
      await onSave(payload);
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(records).filter(v => v === 'Present').length;
  const absentCount = Object.values(records).filter(v => v === 'Absent').length;
  const lateCount = Object.values(records).filter(v => v === 'Late').length;
  const total = students.length;
  const attendancePct = total > 0 ? ((presentCount / total) * 100).toFixed(1) : 0;

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-slate-900/50 border-b border-slate-800 gap-3">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            Attendance Sheet
            {date && <span className="text-xs font-normal text-slate-400">— {date}</span>}
          </h3>
          <div className="flex items-center gap-4 mt-1 text-xs">
            <span className="text-emerald-400 font-semibold">{presentCount} Present</span>
            <span className="text-red-400 font-semibold">{absentCount} Absent</span>
            {lateCount > 0 && <span className="text-yellow-400 font-semibold">{lateCount} Late</span>}
            <span className="text-slate-400">{total} Total</span>
            <span className={`font-bold ${parseFloat(attendancePct) < 75 ? 'text-red-400' : 'text-emerald-400'}`}>
              {attendancePct}% Attendance
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => markAll('Present')}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white text-xs font-bold border border-emerald-500/30 transition-all"
          >
            All Present
          </button>
          <button
            onClick={() => markAll('Absent')}
            disabled={disabled}
            className="px-3 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white text-xs font-bold border border-red-500/30 transition-all"
          >
            All Absent
          </button>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs border border-slate-700 transition-all"
          >
            {collapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <>
          {students.length === 0 ? (
            <div className="px-5 py-8 text-center text-xs text-slate-500 italic">
              No students found. Select a course to populate the attendance sheet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/30">
                    <th className="text-left px-5 py-3 text-slate-400 font-semibold w-8">#</th>
                    <th className="text-left px-3 py-3 text-slate-400 font-semibold">Student</th>
                    <th className="text-left px-3 py-3 text-slate-400 font-semibold hidden sm:table-cell">ID</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold">Status</th>
                    <th className="text-center px-3 py-3 text-slate-400 font-semibold">Quick Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student, idx) => {
                    const status = records[student.id] || 'Present';
                    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Present;
                    const Icon = cfg.icon;

                    return (
                      <tr
                        key={student.id}
                        className={`border-b border-slate-800/50 transition-colors hover:bg-slate-800/30 ${idx % 2 === 0 ? '' : 'bg-slate-900/20'}`}
                      >
                        <td className="px-5 py-3 text-slate-500">{idx + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-blue-400 flex-shrink-0">
                              {student.full_name.substring(0, 2).toUpperCase()}
                            </div>
                            <span className="font-medium text-white truncate max-w-[140px]">{student.full_name}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-slate-400 hidden sm:table-cell">{student.student_code}</td>
                        <td className="px-3 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-bold ${cfg.bg} ${cfg.color}`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            {status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1">
                            {['Present', 'Absent', 'Late'].map(s => (
                              <button
                                key={s}
                                onClick={() => setStudentStatus(student.id, s)}
                                disabled={disabled}
                                title={s}
                                className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all ${
                                  status === s
                                    ? `${STATUS_CONFIG[s].btnBg} text-white border-transparent shadow-sm`
                                    : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                }`}
                              >
                                {STATUS_CONFIG[s].label}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Save Bar */}
          {onSave && students.length > 0 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800 bg-slate-900/30">
              {saved ? (
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Attendance saved successfully
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  {Object.values(records).filter(v => v !== (initialRecords[Object.keys(records)[0]] || 'Present')).length || 'Review'} records ready to save
                </span>
              )}
              <button
                onClick={handleSave}
                disabled={saving || disabled || loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AttendanceTable;
