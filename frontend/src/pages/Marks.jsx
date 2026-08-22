import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/common/Modal.jsx';
import {
  Award,
  Plus,
  CheckCircle,
  AlertOctagon,
  FileSpreadsheet,
  Save,
  Sparkles,
  Loader2,
  Check
} from 'lucide-react';

export const Marks = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canUploadMarks = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'DEAN' || role === 'HOD' || role === 'FACULTY';

  const [marksList, setMarksList] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    student_id: '',
    subject_id: '',
    semester: 3,
    internal_marks: 20,
    assignment_marks: 15,
    midterm_marks: 25,
    external_marks: 25
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mkRes, stuRes, sbRes] = await Promise.all([
        api.get('/marks'),
        api.get('/students'),
        api.get('/subjects')
      ]);
      setMarksList(mkRes.marks || []);
      const stuList = stuRes.students || [];
      const sbList = sbRes.subjects || [];
      setStudents(stuList);
      setSubjects(sbList);

      setForm(prev => ({
        ...prev,
        student_id: prev.student_id || (stuList.length > 0 ? stuList[0].id : ''),
        subject_id: prev.subject_id || (sbList.length > 0 ? sbList[0].id : '')
      }));
    } catch (e) {
      console.warn('[Marks] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = () => {
    if (students.length > 0 && !form.student_id) {
      setForm(prev => ({ ...prev, student_id: students[0].id }));
    }
    if (subjects.length > 0 && !form.subject_id) {
      setForm(prev => ({ ...prev, subject_id: subjects[0].id }));
    }
    setIsModalOpen(true);
  };

  const handleUploadMarks = async (e) => {
    e.preventDefault();
    if (saving) return;

    // Ensure student_id and subject_id are assigned
    const targetStudentId = form.student_id || (students.length > 0 ? students[0].id : '');
    const targetSubjectId = form.subject_id || (subjects.length > 0 ? subjects[0].id : '');

    if (!targetStudentId || !targetSubjectId) {
      alert('Please ensure both a Student and a Subject are selected.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        student_id: targetStudentId,
        subject_id: targetSubjectId
      };

      const res = await api.post('/marks', payload);
      if (res && (res.success || res.mark)) {
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          setIsModalOpen(false);
        }, 600);
        await fetchData();
      }
    } catch (err) {
      console.error('[Marks] Save error:', err);
      alert(err.message || 'Error recording student marks');
    } finally {
      setSaving(false);
    }
  };

  const calculatedTotal = Number(form.internal_marks || 0) + Number(form.assignment_marks || 0) + Number(form.midterm_marks || 0) + Number(form.external_marks || 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-500" />
            Academic Marks, Evaluation & Backlog Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Record internal assessments, midterm scores, assignment marks, and track student backlog flags.
          </p>
        </div>

        {canUploadMarks && (
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Record Student Marks
          </button>
        )}
      </div>

      {/* Marks Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            Examination Score Matrix ({marksList.length})
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Auto-calculated Grades & Backlog Flags
          </span>
        </div>

        {loading ? (
          <div className="text-center text-slate-400 text-xs py-12 flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            <span>Loading examination score matrix...</span>
          </div>
        ) : marksList.length === 0 ? (
          <div className="text-center text-slate-400 text-xs py-12">No evaluation marks recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Internal</th>
                  <th className="p-3">Assignment</th>
                  <th className="p-3">Midterm</th>
                  <th className="p-3">External</th>
                  <th className="p-3">Total Score</th>
                  <th className="p-3">Grade</th>
                  <th className="p-3">Backlog Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {marksList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3">
                      <span className="font-bold text-white block">{m.student_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{m.student_code}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-blue-400 block">{m.subject_code}</span>
                      <span className="text-[10px] text-slate-400">{m.subject_name}</span>
                    </td>
                    <td className="p-3">{m.internal_marks} / 25</td>
                    <td className="p-3">{m.assignment_marks} / 25</td>
                    <td className="p-3">{m.midterm_marks} / 25</td>
                    <td className="p-3">{m.external_marks} / 25</td>
                    <td className="p-3 font-extrabold text-amber-400">{m.total_marks} / 100</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        m.grade === 'F' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}>
                        {m.grade}
                      </span>
                    </td>
                    <td className="p-3">
                      {m.is_backlog ? (
                        <span className="px-2 py-1 rounded-lg bg-rose-500/20 text-rose-400 font-bold text-[10px] flex items-center gap-1 w-fit border border-rose-500/30">
                          <AlertOctagon className="w-3 h-3" /> Active Backlog
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-[10px] flex items-center gap-1 w-fit border border-emerald-500/30">
                          <CheckCircle className="w-3 h-3" /> Cleared
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal to Upload Marks */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Student Examination Marks">
        <form onSubmit={handleUploadMarks} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Student</label>
            <select
              value={form.student_id}
              onChange={e => setForm({ ...form, student_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
            >
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.full_name} ({s.student_id_number || s.student_code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Select Subject</label>
            <select
              value={form.subject_id}
              onChange={e => setForm({ ...form, subject_id: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
            >
              {subjects.map(sb => (
                <option key={sb.id} value={sb.id}>{sb.subject_code} - {sb.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Internal Marks (Max 25)</label>
              <input
                type="number"
                min="0"
                max="25"
                value={form.internal_marks}
                onChange={e => setForm({ ...form, internal_marks: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Assignment Marks (Max 25)</label>
              <input
                type="number"
                min="0"
                max="25"
                value={form.assignment_marks}
                onChange={e => setForm({ ...form, assignment_marks: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Midterm Marks (Max 25)</label>
              <input
                type="number"
                min="0"
                max="25"
                value={form.midterm_marks}
                onChange={e => setForm({ ...form, midterm_marks: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">External Exam Marks (Max 25)</label>
              <input
                type="number"
                min="0"
                max="25"
                value={form.external_marks}
                onChange={e => setForm({ ...form, external_marks: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">Calculated Total Score:</span>
            <span className={`font-extrabold text-sm ${calculatedTotal >= 40 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {calculatedTotal} / 100 {calculatedTotal < 40 ? '(Backlog Flagged)' : '(Passed)'}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Marks</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
