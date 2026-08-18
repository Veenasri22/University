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
  Sparkles
} from 'lucide-react';

export const Marks = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canUploadMarks = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'DEAN' || role === 'HOD' || role === 'FACULTY';

  const [marksList, setMarksList] = useState([]);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

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
      setStudents(stuRes.students || []);
      setSubjects(sbRes.subjects || []);

      if (stuRes.students?.length > 0) {
        setForm(prev => ({ ...prev, student_id: stuRes.students[0].id }));
      }
      if (sbRes.subjects?.length > 0) {
        setForm(prev => ({ ...prev, subject_id: sbRes.subjects[0].id }));
      }
    } catch (e) {
      console.warn('[Marks] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUploadMarks = async (e) => {
    e.preventDefault();
    try {
      await api.post('/marks', form);
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      alert(err.message || 'Error recording marks');
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
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Record Student Marks
          </button>
        )}
      </div>

      {/* Marks Table */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-amber-400" />
          Examination Score Matrix
        </h3>

        {loading ? (
          <div className="text-center text-slate-400 text-xs py-12">Loading examination score matrix...</div>
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
                    <td className="p-3">{m.internal_marks}</td>
                    <td className="p-3">{m.assignment_marks}</td>
                    <td className="p-3">{m.midterm_marks}</td>
                    <td className="p-3">{m.external_marks}</td>
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
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
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
            >
              Save Marks
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
