import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { NlQueryTerminal } from '../NlQueryTerminal.jsx';
import {
  Users,
  GraduationCap,
  Award,
  AlertOctagon,
  Download,
  FileSpreadsheet,
  TrendingUp,
  Brain,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export const AdminDashboard = () => {
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
        console.warn('[AdminDashboard] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalStudents = students.length;
  const totalFaculty = faculty.length;
  const avgGpa = totalStudents > 0
    ? (students.reduce((acc, s) => acc + Number(s.cgpa || s.current_gpa || 0), 0) / totalStudents).toFixed(2)
    : '0.00';
  const highRiskCount = students.filter(s => (s.current_risk_level || s.predicted_risk) === 'HIGH').length;
  const mediumRiskCount = students.filter(s => (s.current_risk_level || s.predicted_risk) === 'MEDIUM').length;
  const lowRiskCount = students.filter(s => (s.current_risk_level || s.predicted_risk) === 'LOW').length;

  // Department CGPA Breakdown
  const deptData = [
    { name: 'CSE', avgGpa: 3.24, students: students.filter(s => s.department === 'Computer Science' || s.department_id).length || 12 },
    { name: 'ECE', avgGpa: 3.45, students: 8 },
    { name: 'MECH', avgGpa: 2.95, students: 6 },
    { name: 'CIVIL', avgGpa: 3.10, students: 5 },
    { name: 'IT', avgGpa: 3.38, students: 7 }
  ];

  // Risk Distribution Pie Data
  const riskPieData = [
    { name: 'Low Risk', value: lowRiskCount || 14, color: '#10B981' },
    { name: 'Medium Risk', value: mediumRiskCount || 4, color: '#F59E0B' },
    { name: 'High Risk', value: highRiskCount || 2, color: '#EF4444' }
  ];

  const handleExportCsv = () => {
    const csvRows = [];
    csvRows.push(['Student ID', 'Full Name', 'Department', 'CGPA', 'Risk Level']);
    students.forEach(s => {
      csvRows.push([
        s.student_id_number || s.student_code || s.id,
        `"${s.full_name || 'Student'}"`,
        `"${s.department || 'CSE'}"`,
        s.cgpa || s.current_gpa || 0,
        s.current_risk_level || s.predicted_risk || 'LOW'
      ]);
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `University_Academic_Report_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <Award className="w-6 h-6 text-blue-500" />
            University Executive Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            High-level institution KPI summaries, department comparisons, and Groq AI natural language query terminal.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Export Report (CSV)
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Enrolled Students</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-outfit">{totalStudents || 20}</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Active across 5 Departments</span>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Faculty Members</span>
            <GraduationCap className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-extrabold text-white font-outfit">{totalFaculty || 8}</div>
          <span className="text-[10px] text-blue-400 font-semibold">Full-Time Instructors</span>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">University Average CGPA</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400 font-outfit">{avgGpa}</div>
          <span className="text-[10px] text-slate-400">Out of 4.00 Scale</span>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-rose-500/20 bg-rose-950/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300">At-Risk Students</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 font-outfit">{highRiskCount}</div>
          <span className="text-[10px] text-rose-300 font-semibold">Requires Intervention</span>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department CGPA Comparison Bar Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Department Average CGPA Comparison
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis domain={[0, 4]} stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="avgGpa" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Pie Chart */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-400" />
            Student Risk Distribution
          </h3>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={riskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                  {riskPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[11px] font-semibold">
            {riskPieData.map((item, idx) => (
              <span key={idx} className="flex items-center gap-1.5" style={{ color: item.color }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Groq Natural Language AI Terminal */}
      <NlQueryTerminal />
    </div>
  );
};
