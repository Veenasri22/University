import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { RiskBadge } from '../common/RiskBadge.jsx';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Clock,
  Sparkles
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const HodDashboard = () => {
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stuRes, facRes] = await Promise.all([
          api.get('/students'),
          api.get('/faculty')
        ]);
        setStudents(stuRes.students || []);
        setFaculty(facRes.faculty || []);
      } catch (e) {
        console.warn('[HodDashboard] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const atRiskRoster = students.filter(s => (s.current_risk_level || s.predicted_risk) === 'HIGH' || (s.current_risk_level || s.predicted_risk) === 'MEDIUM');

  const attendanceTrend = [
    { week: 'Week 1', rate: 94.2 },
    { week: 'Week 2', rate: 91.5 },
    { week: 'Week 3', rate: 88.0 },
    { week: 'Week 4', rate: 85.4 },
    { week: 'Week 5', rate: 87.2 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
          <Building2 className="w-6 h-6 text-indigo-500" />
          Department Head (HOD) Portal
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Department-wide attendance trends, faculty workload monitoring, syllabus pacing, and intervention rosters.
        </p>
      </div>

      {/* Grid Row: Attendance Trend & Faculty Workloads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Line Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            Department Attendance Rate Trajectory
          </h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Faculty Workload Monitor */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-400" />
            Department Faculty Workload Allocation
          </h3>
          <div className="space-y-3">
            {faculty.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No faculty assigned to department.</p>
            ) : (
              faculty.map(f => {
                const pct = Math.min(100, Math.round(((f.workload_hours || 25) / (f.max_workload_hours || 40)) * 100));
                return (
                  <div key={f.id} className="space-y-1 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-white">{f.full_name}</span>
                      <span className="text-slate-400">{f.workload_hours || 25}h / 40h</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* At-Risk Student Intervention Roster */}
      <div className="glass-panel rounded-3xl p-6 border border-rose-500/20 bg-rose-950/10 space-y-4">
        <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          At-Risk Student Intervention Roster
        </h3>

        {atRiskRoster.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No at-risk students flagged in department.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Student Code</th>
                  <th className="p-3">Full Name</th>
                  <th className="p-3">Semester</th>
                  <th className="p-3">CGPA</th>
                  <th className="p-3">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {atRiskRoster.map(s => (
                  <tr key={s.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-3 font-mono text-blue-400">{s.student_id_number || s.student_code}</td>
                    <td className="p-3 font-bold text-white">{s.full_name}</td>
                    <td className="p-3">Semester {s.semester || 3}</td>
                    <td className="p-3 font-bold text-amber-400">{s.cgpa || s.current_gpa}</td>
                    <td className="p-3"><RiskBadge riskLevel={s.current_risk_level || s.predicted_risk} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
