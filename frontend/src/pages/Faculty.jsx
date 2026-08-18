import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Modal } from '../components/common/Modal.jsx';
import {
  GraduationCap,
  Award,
  BookOpen,
  Brain,
  Sparkles,
  Search,
  Plus,
  Filter,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

export const Faculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State for New Faculty
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    full_name: '',
    email: '',
    department: 'Computer Science',
    designation: 'Assistant Professor',
    workload_hours: 20,
    max_workload_hours: 40,
    teaching_rating: 4.8,
    research_publications: 3,
    courses_taught: 'CS101, CS201'
  });

  const fetchFacultyData = async () => {
    try {
      setLoading(true);
      const [facRes, insRes] = await Promise.all([
        api.get('/faculty', { params: { department } }),
        api.get('/faculty/insights')
      ]);
      setFaculty(facRes.faculty || []);
      setInsights(insRes);
    } catch (e) {
      console.warn('[Faculty] Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyData();
  }, [department]);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    try {
      await api.post('/faculty', newFaculty);
      setIsModalOpen(false);
      setNewFaculty({
        full_name: '',
        email: '',
        department: 'Computer Science',
        designation: 'Assistant Professor',
        workload_hours: 20,
        max_workload_hours: 40,
        teaching_rating: 4.8,
        research_publications: 3,
        courses_taught: 'CS101, CS201'
      });
      fetchFacultyData();
    } catch (err) {
      alert(err.message || 'Error creating faculty record');
    }
  };

  const filteredFaculty = faculty.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = f.full_name?.toLowerCase().includes(q);
    const deptMatch = f.department?.toLowerCase().includes(q);
    const courseMatch = f.courses_taught?.some(c => c.toLowerCase().includes(q));
    return nameMatch || deptMatch || courseMatch;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            Faculty & Course Instructors
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Faculty directory, assigned courses, teaching ratings, and department allocations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search faculty or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Departments</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Business Administration">Business Admin</option>
            <option value="Mechanical Engineering">Mechanical Eng</option>
            <option value="Life Sciences">Life Sciences</option>
          </select>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Faculty
          </button>
        </div>
      </div>

      {/* Faculty Insights Executive Banner */}
      {insights && (
        <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 bg-blue-950/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Generative Faculty Effectiveness Summary</h3>
              <p className="text-xs text-blue-300">Gemini Sentiment Synthesis over Student Evaluations</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            "{insights.aiSentimentSummary}"
          </p>
        </div>
      )}

      {/* Faculty Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12">Loading faculty roster...</div>
        ) : filteredFaculty.length === 0 ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
            <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-white mb-1">No faculty members registered yet</p>
            <p className="text-slate-400">Click "Add Faculty" above to enroll your institutional faculty into Supabase.</p>
          </div>
        ) : (
          filteredFaculty.map((f) => {
            const workloadPct = Math.min(100, Math.round((f.workload_hours / (f.max_workload_hours || 40)) * 100));
            const isOverloaded = f.workload_hours > (f.max_workload_hours || 40);

            return (
              <div key={f.id} className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-blue-500/30 transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-base">
                      {(f.full_name || 'FC').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{f.full_name}</h3>
                      <p className="text-xs text-blue-400 font-semibold">{f.designation} • {f.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-500/20">
                    <Award className="w-3.5 h-3.5" />
                    <span>{f.teaching_rating} / 5.0</span>
                  </div>
                </div>

                {/* Workload Progress Bar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Weekly Workload Allocation:</span>
                    <span className={`font-bold ${isOverloaded ? 'text-rose-400' : 'text-slate-200'}`}>
                      {f.workload_hours}h / {f.max_workload_hours || 40}h ({workloadPct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${isOverloaded ? 'bg-rose-500 animate-pulse' : workloadPct > 80 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${workloadPct}%` }}
                    />
                  </div>
                </div>

                {/* Courses Taught */}
                <div className="text-xs space-y-1">
                  <span className="text-slate-400 font-semibold">Assigned Courses:</span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {f.courses_taught?.map((c, idx) => (
                      <span key={idx} className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] font-semibold border border-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Adding New Faculty */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Faculty Member">
        <form onSubmit={handleCreateFaculty} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Full Name</label>
            <input
              type="text"
              required
              placeholder="Dr. Jane Smith"
              value={newFaculty.full_name}
              onChange={e => setNewFaculty({ ...newFaculty, full_name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Email Address</label>
            <input
              type="email"
              placeholder="jane.smith@university.edu"
              value={newFaculty.email}
              onChange={e => setNewFaculty({ ...newFaculty, email: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
              <select
                value={newFaculty.department}
                onChange={e => setNewFaculty({ ...newFaculty, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Business Administration">Business Admin</option>
                <option value="Mechanical Engineering">Mechanical Eng</option>
                <option value="Life Sciences">Life Sciences</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Designation</label>
              <input
                type="text"
                required
                placeholder="Associate Professor"
                value={newFaculty.designation}
                onChange={e => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Workload Hours (Weekly)</label>
              <input
                type="number"
                value={newFaculty.workload_hours}
                onChange={e => setNewFaculty({ ...newFaculty, workload_hours: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Teaching Rating (0-5)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                value={newFaculty.teaching_rating}
                onChange={e => setNewFaculty({ ...newFaculty, teaching_rating: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Assigned Courses (Comma separated)</label>
            <input
              type="text"
              placeholder="CS101 Intro, CS201 Data Structures"
              value={newFaculty.courses_taught}
              onChange={e => setNewFaculty({ ...newFaculty, courses_taught: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              Save to Supabase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
