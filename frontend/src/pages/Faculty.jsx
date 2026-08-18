import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import {
  GraduationCap,
  Award,
  BookOpen,
  Brain,
  Sparkles,
  Search,
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

        <div className="flex items-center gap-3">
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
          <div className="col-span-2 text-center text-slate-400 text-xs py-12">No faculty members found matching "{searchQuery}".</div>
        ) : (
          filteredFaculty.map((f) => {
            const workloadPct = Math.min(100, Math.round((f.workload_hours / (f.max_workload_hours || 40)) * 100));
            const isOverloaded = f.workload_hours > (f.max_workload_hours || 40);

            return (
              <div key={f.id} className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-blue-500/30 transition-all space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-600 flex items-center justify-center font-bold text-white text-base">
                      {f.full_name.substring(0, 2).toUpperCase()}
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

                {/* Evaluation Sentiment Snippet */}
                {f.evaluation_sentiment && (
                  <div className="text-[11px] text-slate-400 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <strong>Student Feedback Sentiment:</strong> {f.evaluation_sentiment}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
