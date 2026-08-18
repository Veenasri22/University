import React, { useEffect, useState } from 'react';
import { StatCard } from '../components/common/StatCard.jsx';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';
import {
  Users,
  GraduationCap,
  AlertTriangle,
  Award,
  Sparkles,
  TrendingUp,
  Brain,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useNavigate } from 'react-router-dom';

const riskData = [
  { name: 'Low Risk', value: 65, color: '#10b981' },
  { name: 'Moderate Risk', value: 22, color: '#f59e0b' },
  { name: 'High Risk', value: 13, color: '#ef4444' }
];

const gpaTrendData = [
  { term: 'Fall 2024', gpa: 3.12, attendance: 88.2 },
  { term: 'Spring 2025', gpa: 3.18, attendance: 89.0 },
  { term: 'Fall 2025', gpa: 3.24, attendance: 90.5 },
  { term: 'Spring 2026', gpa: 3.28, attendance: 91.8 }
];

const departmentPerformanceData = [
  { dept: 'Computer Sci', avgGpa: 3.42, students: 420 },
  { dept: 'Business Admin', avgGpa: 3.58, students: 510 },
  { dept: 'Mechanical Eng', avgGpa: 3.15, students: 380 },
  { dept: 'Life Sciences', avgGpa: 3.61, students: 290 },
  { dept: 'Humanities', avgGpa: 3.30, students: 210 }
];

export const Dashboard = () => {
  const { user } = useAuth();
  const isStudent = user?.role === 'STUDENT' || user?.role === 'Student';
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stuRes, facRes] = await Promise.all([
          api.get('/students'),
          api.get('/faculty')
        ]);
        setStudents(stuRes.students || []);
        setFaculty(facRes.faculty || []);
      } catch (e) {
        console.warn('[Dashboard] API Fetch error, relying on default metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const atRiskCount = students.filter(s => s.predicted_risk === 'HIGH').length || 2;
  const avgGpa = students.length
    ? (students.reduce((a, b) => a + Number(b.current_gpa), 0) / students.length).toFixed(2)
    : '3.28';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 relative overflow-hidden border border-blue-500/20">
        <div className="absolute right-0 top-0 w-96 h-96 bg-gradient-to-bl from-blue-600/20 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-400 mb-2">
              <Brain className="w-3.5 h-3.5" />
              <span>{isStudent ? `Welcome back, ${user?.full_name || 'Student'}` : 'Gemini 2.5 Flash Engine Active'}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-outfit tracking-tight">
              {isStudent ? 'Student Academic Portal' : 'Executive Academic Intelligence'}
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              {isStudent
                ? `Track your attendance logs, enrolled curriculum courses, prerequisites, and faculty course instructors for ${user?.department || 'Computer Science'}.`
                : 'Consolidated real-time monitoring across 5 university departments, student GPA risk trajectories, and accreditation readiness.'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/ai-advisor')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI Advisor
            </button>
            {!isStudent && (
              <button
                onClick={() => navigate('/reports')}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
              >
                Generate Audit Report
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Student Specific Quick Access Action Cards */}
      {isStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            onClick={() => navigate('/attendance')}
            className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:scale-110 transition-all">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-outfit">My Attendance Logs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Check class participation records & compliance thresholds.</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-400">
              <span>Attendance Rate: 90.0%</span>
              <span>Good Standing</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/curriculum')}
            className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-110 transition-all">
                <BookOpen className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-outfit">Courses & Curriculum</h3>
              <p className="text-xs text-slate-400 mt-0.5">View syllabus progress, prerequisites & learning outcomes.</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-indigo-400">
              <span>Syllabus Completion</span>
              <span>Track Progress</span>
            </div>
          </div>

          <div
            onClick={() => navigate('/faculty')}
            className="glass-card rounded-3xl p-6 border border-slate-800 hover:border-blue-500/40 transition-all cursor-pointer group space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:scale-110 transition-all">
                <GraduationCap className="w-6 h-6" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-outfit">Faculty & Subjects Taught</h3>
              <p className="text-xs text-slate-400 mt-0.5">Look up professors and which subjects they teach.</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-amber-400">
              <span>Faculty Directory</span>
              <span>Search Instructors</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Student Cohort"
          value="1,810"
          delta="+4.2%"
          deltaType="positive"
          icon={Users}
          subtitle="Enrolled across 5 key faculties"
        />
        <StatCard
          title="Institutional Average GPA"
          value={avgGpa}
          delta="+0.12 GPA"
          deltaType="positive"
          icon={Award}
          subtitle="Upward trajectory over 3 semesters"
        />
        <StatCard
          title="At-Risk Students (High)"
          value={atRiskCount}
          delta="-2 Risk Cases"
          deltaType="positive"
          icon={AlertTriangle}
          subtitle="Requires immediate advisor intervention"
        />
        <StatCard
          title="Active Faculty Roster"
          value={faculty.length || 18}
          delta="42h Max Load"
          deltaType="positive"
          icon={GraduationCap}
          subtitle="4.78/5.0 avg teaching rating"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPA Trajectory Trend */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                Institutional GPA & Attendance Trajectory
              </h2>
              <p className="text-xs text-slate-400">Historical performance trends across recent terms</p>
            </div>
            <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20">
              Spring 2026 Cohort
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={gpaTrendData}>
                <defs>
                  <linearGradient id="gpaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="term" stroke="#64748b" fontSize={11} />
                <YAxis domain={[2.5, 4.0]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="gpa" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#gpaGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Student Risk Tier Breakdown
            </h2>
            <p className="text-xs text-slate-400">Predicted AI risk analysis distribution</p>
          </div>

          <div className="h-52 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {riskData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800">
            {riskData.map(r => (
              <div key={r.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-slate-300">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.name}
                </span>
                <span className="font-bold text-white">{r.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent AI Action Items Stream */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Urgent Predictive AI Interventions</h2>
              <p className="text-xs text-slate-400">Automated risk alerts needing Dean/Advisor action</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/students')}
            className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            View Student Directory
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.filter(s => s.predicted_risk === 'HIGH').concat(students.filter(s => s.predicted_risk === 'MEDIUM')).slice(0, 4).map(s => (
            <div key={s.id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700">
                  {s.full_name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{s.full_name}</h4>
                  <p className="text-[11px] text-slate-400">{s.department} • GPA: {s.current_gpa} • Attendance: {s.attendance_rate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <RiskBadge riskLevel={s.predicted_risk} />
                <button
                  onClick={() => navigate(`/students/${s.id}`)}
                  className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold transition-colors"
                >
                  Inspect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
