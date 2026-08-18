import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Modal } from '../components/common/Modal.jsx';
import {
  Building2,
  Users,
  GraduationCap,
  Plus,
  Search,
  CheckCircle,
  Award,
  Sparkles
} from 'lucide-react';

export const Departments = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const canAddDept = role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'DEAN' || role === 'HOD';

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', code: '' });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments', { params: { search } });
      setDepartments(res.departments || []);
    } catch (e) {
      console.warn('[Departments] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await api.post('/departments', form);
      setIsModalOpen(false);
      setForm({ name: '', code: '' });
      fetchDepartments();
    } catch (err) {
      alert(err.message || 'Error creating department');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-500" />
            University Departments & Academic HODs
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage institutional department structures, HOD appointments, and student distributions.
          </p>
        </div>

        {canAddDept && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center text-slate-400 text-xs py-12">Loading department roster...</div>
        ) : departments.length === 0 ? (
          <div className="col-span-3 text-center text-slate-400 text-xs py-12">No departments found.</div>
        ) : (
          departments.map((dept) => (
            <div key={dept.id} className="glass-card rounded-3xl p-6 border border-slate-800 space-y-4 hover:border-blue-500/30 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-extrabold border border-blue-500/20">
                    {dept.code}
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{dept.name}</h3>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm">
                  {dept.code}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-semibold">Head of Department (HOD):</span>
                  <span className="font-bold text-white">{dept.hod_name || 'Dr. Eleanor Harrison'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for New Department */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New University Department">
        <form onSubmit={handleCreateDepartment} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Department Name</label>
            <input
              type="text"
              required
              placeholder="Computer Science & Engineering"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Department Code</label>
            <input
              type="text"
              required
              placeholder="CSE"
              value={form.code}
              onChange={e => setForm({ ...form, code: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
            />
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
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Save Department
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
