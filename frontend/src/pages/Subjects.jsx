import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/common/Modal.jsx';
import {
  BookOpen,
  Plus,
  CheckCircle,
  GraduationCap,
  Sparkles,
  Save,
  Layers
} from 'lucide-react';

export const Subjects = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canEditUnits = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'DEAN' || role === 'HOD' || role === 'FACULTY';

  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    subject_code: '',
    name: '',
    credits: 3,
    semester: 3,
    total_units: 5
  });

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await api.get('/subjects');
      setSubjects(res.subjects || []);
    } catch (e) {
      console.warn('[Subjects] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleUpdateUnits = async (id, units) => {
    try {
      await api.patch(`/subjects/${id}/units`, { completed_units: units });
      fetchSubjects();
    } catch (err) {
      alert('Error updating syllabus units');
    }
  };

  const handleCreateSubject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/subjects', form);
      setIsModalOpen(false);
      setForm({ subject_code: '', name: '', credits: 3, semester: 3, total_units: 5 });
      fetchSubjects();
    } catch (err) {
      alert(err.message || 'Error creating subject');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-500" />
            Subjects Catalog & 5-Unit Syllabus Pacing Tracker
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Course curriculum unit milestones, credits distribution, and instructor allocations.
          </p>
        </div>

        {canEditUnits && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Subject
          </button>
        )}
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12">Loading subjects catalog...</div>
        ) : subjects.length === 0 ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12">No subjects found.</div>
        ) : (
          subjects.map((subj) => {
            const total = subj.total_units || 5;
            const completed = subj.completed_units || 0;
            const pct = Math.round((completed / total) * 100);

            return (
              <div key={subj.id} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-extrabold border border-indigo-500/20">
                      {subj.subject_code} • Semester {subj.semester || 3}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{subj.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Instructor: {subj.faculty_name || 'Prof. Marcus Chen'}</p>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {subj.credits || 3} Credits
                  </span>
                </div>

                {/* 5-Unit Progress Slider */}
                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-300">Syllabus Completion: {completed} / {total} Units</span>
                    <span className="font-extrabold text-indigo-400">{pct}%</span>
                  </div>

                  <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden border border-slate-800">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 transition-all duration-300" style={{ width: `${pct}%` }} />
                  </div>

                  {/* Interactive Unit Buttons */}
                  {canEditUnits && (
                    <div className="flex items-center gap-1.5 pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase mr-1">Units Completed:</span>
                      {[0, 1, 2, 3, 4, 5].map((u) => (
                        <button
                          key={u}
                          onClick={() => handleUpdateUnits(subj.id, u)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                            completed === u
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for New Subject */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Subject Entry">
        <form onSubmit={handleCreateSubject} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Code</label>
            <input
              type="text"
              required
              placeholder="CS201"
              value={form.subject_code}
              onChange={e => setForm({ ...form, subject_code: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="Data Structures & Algorithms"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Credits</label>
              <input
                type="number"
                min="1"
                max="6"
                value={form.credits}
                onChange={e => setForm({ ...form, credits: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Semester</label>
              <input
                type="number"
                min="1"
                max="8"
                value={form.semester}
                onChange={e => setForm({ ...form, semester: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
