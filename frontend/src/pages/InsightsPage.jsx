import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { AIInsightCard } from '../components/AIInsightCard.jsx';
import { AlertBadge } from '../components/AlertBadge.jsx';
import { ModalContainer } from '../components/ModalContainer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Brain,
  Sparkles,
  User,
  GraduationCap,
  Building,
  BarChart3,
  HelpCircle,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Loader2,
  BookOpen,
  Target,
  Clock,
  Users
} from 'lucide-react';

const TABS = [
  { id: 'predict', label: 'Risk Prediction', icon: Brain, desc: 'Predict student academic failure risk & CGPA trajectory' },
  { id: 'advisor', label: 'Advisor Plan', icon: Target, desc: 'Generate personalized study plans and intervention actions' },
  { id: 'faculty', label: 'Faculty Analytics', icon: GraduationCap, desc: 'Teaching effectiveness & workload diagnostic report' },
  { id: 'diagnostic', label: 'Diagnostic Q&A', icon: HelpCircle, desc: 'AI-generated probing questions for data quality review' }
];

const DEPARTMENTS = ['Computer Science', 'Business Administration', 'Mechanical Engineering', 'Life Sciences', 'Humanities'];
const PROGRAMS = ['B.Tech Computer Science', 'B.Sc Data Science', 'B.Sc Business Administration', 'B.Tech Mechanical Engineering', 'B.Sc Life Sciences', 'B.A Humanities'];
const ENTITY_TYPES = ['Student', 'Faculty', 'Department', 'Course'];

export const InsightsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('predict');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [diagnosticModal, setDiagnosticModal] = useState(false);

  // Students list for selector
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);

  // Form state — Prediction
  const [predForm, setPredForm] = useState({
    studentId: 'stu-101',
    department: 'Computer Science',
    program: 'B.Tech Computer Science',
    semester: 5,
    cgpa: 2.34,
    attendancePct: 68.5,
    assessments: [
      { title: 'Midterm Exam', scoreObtained: 52, maxScore: 100 },
      { title: 'Lab Assignment', scoreObtained: 74, maxScore: 100 }
    ]
  });

  // Form state — Advisor
  const [advisorForm, setAdvisorForm] = useState({
    studentId: 'stu-101',
    department: 'Computer Science',
    program: 'B.Tech Computer Science',
    semester: 5,
    cgpa: 2.34,
    attendancePct: 68.5,
    riskLevel: 'High',
    specificConcerns: ['Data Structures & Algorithms', 'Attendance below 70%']
  });

  // Form state — Faculty
  const [facultyForm, setFacultyForm] = useState({
    facultyId: 'fac-201',
    facultyName: 'Prof. Marcus Chen',
    department: 'Computer Science',
    academicTerm: '2026 Fall',
    weeklyTeachingHours: 38,
    avgStudentFeedback: 4.82,
    courseCount: 2,
    researchPublications: 14
  });

  // Form state — Diagnostic
  const [diagForm, setDiagForm] = useState({
    context: 'Student showing declining GPA (2.34) and low attendance (68.5%) over 3 consecutive semesters',
    entityType: 'Student',
    dataSnapshot: {}
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stuRes, facRes] = await Promise.all([api.get('/students'), api.get('/faculty')]);
        setStudents(stuRes.students || []);
        setFaculty(facRes.faculty || []);
      } catch (_) {}
    };
    fetchData();
  }, []);

  const handleVerifyReport = async (reportId) => {
    await api.patch(`/ai/reports/${reportId}/verify`);
  };

  const runPrediction = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/predict-performance', {
        ...predForm,
        semester: Number(predForm.semester),
        cgpa: Number(predForm.cgpa),
        attendancePct: Number(predForm.attendancePct)
      });
      setResult({ type: 'predict', data: res });
    } catch (err) {
      setError(err.message || 'Failed to generate prediction');
    } finally {
      setLoading(false);
    }
  };

  const runAdvisor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/advisor-recommendations', {
        ...advisorForm,
        semester: Number(advisorForm.semester),
        cgpa: Number(advisorForm.cgpa),
        attendancePct: Number(advisorForm.attendancePct)
      });
      setResult({ type: 'advisor', data: res });
    } catch (err) {
      setError(err.message || 'Failed to generate advisory plan');
    } finally {
      setLoading(false);
    }
  };

  const runFacultyInsight = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/faculty-insights', {
        ...facultyForm,
        weeklyTeachingHours: Number(facultyForm.weeklyTeachingHours),
        avgStudentFeedback: Number(facultyForm.avgStudentFeedback),
        courseCount: Number(facultyForm.courseCount),
        researchPublications: Number(facultyForm.researchPublications)
      });
      setResult({ type: 'faculty', data: res });
    } catch (err) {
      setError(err.message || 'Failed to generate faculty insight');
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostic = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.post('/ai/diagnostic-questions', diagForm);
      setResult({ type: 'diagnostic', data: res });
      setDiagnosticModal(true);
    } catch (err) {
      setError(err.message || 'Failed to generate diagnostic questions');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors';
  const labelCls = 'block text-xs font-semibold text-slate-300 mb-1';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="glass-panel rounded-3xl p-6 border border-blue-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-indigo-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-bold text-indigo-400 mb-2">
              <Brain className="w-3.5 h-3.5" />
              <span>Gemini AI Academic Intelligence Engine</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight">
              AI Academic Insights Hub
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              Predictive risk modeling, personalized advisor plans, faculty diagnostics, and data quality review powered by Google Gemini.
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setResult(null); setError(''); }}
              className={`p-4 rounded-2xl border text-left transition-all ${
                isActive
                  ? 'bg-blue-600/15 border-blue-500/40 shadow-lg shadow-blue-600/10'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`flex items-center gap-2 mb-1 ${isActive ? 'text-blue-400' : 'text-slate-400'}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold">{tab.label}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">{tab.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-2">
          <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
            {/* ─── PREDICTION FORM ─── */}
            {activeTab === 'predict' && (
              <form onSubmit={runPrediction} className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Brain className="w-4 h-4 text-blue-400" /> Student Risk Prediction
                </h2>
                <div>
                  <label className={labelCls}>Student</label>
                  <select value={predForm.studentId} onChange={e => setPredForm(p => ({ ...p, studentId: e.target.value }))} className={inputCls}>
                    {students.length > 0
                      ? students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)
                      : <option value="stu-101">Alex Rivera (CS-2023-089)</option>
                    }
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Department</label>
                    <select value={predForm.department} onChange={e => setPredForm(p => ({ ...p, department: e.target.value }))} className={inputCls}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Semester</label>
                    <input type="number" min="1" max="12" value={predForm.semester} onChange={e => setPredForm(p => ({ ...p, semester: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Program</label>
                  <select value={predForm.program} onChange={e => setPredForm(p => ({ ...p, program: e.target.value }))} className={inputCls}>
                    {PROGRAMS.map(pr => <option key={pr}>{pr}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Current CGPA (0-4.0)</label>
                    <input type="number" step="0.01" min="0" max="4.0" value={predForm.cgpa} onChange={e => setPredForm(p => ({ ...p, cgpa: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Attendance %</label>
                    <input type="number" step="0.1" min="0" max="100" value={predForm.attendancePct} onChange={e => setPredForm(p => ({ ...p, attendancePct: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/20 transition-all disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Analyzing...' : 'Run AI Prediction'}
                </button>
              </form>
            )}

            {/* ─── ADVISOR FORM ─── */}
            {activeTab === 'advisor' && (
              <form onSubmit={runAdvisor} className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-400" /> Personalized Advisor Plan
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Department</label>
                    <select value={advisorForm.department} onChange={e => setAdvisorForm(p => ({ ...p, department: e.target.value }))} className={inputCls}>
                      {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Semester</label>
                    <input type="number" min="1" max="12" value={advisorForm.semester} onChange={e => setAdvisorForm(p => ({ ...p, semester: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>CGPA</label>
                    <input type="number" step="0.01" min="0" max="4.0" value={advisorForm.cgpa} onChange={e => setAdvisorForm(p => ({ ...p, cgpa: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Attendance %</label>
                    <input type="number" step="0.1" min="0" max="100" value={advisorForm.attendancePct} onChange={e => setAdvisorForm(p => ({ ...p, attendancePct: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Risk Level</label>
                  <select value={advisorForm.riskLevel} onChange={e => setAdvisorForm(p => ({ ...p, riskLevel: e.target.value }))} className={inputCls}>
                    {['Critical', 'High', 'Moderate', 'Low', 'On-Track'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Generating Plan...' : 'Generate Advisory Plan'}
                </button>
              </form>
            )}

            {/* ─── FACULTY FORM ─── */}
            {activeTab === 'faculty' && (
              <form onSubmit={runFacultyInsight} className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-emerald-400" /> Faculty Analytics
                </h2>
                <div>
                  <label className={labelCls}>Faculty Member</label>
                  <select value={facultyForm.facultyId} onChange={e => {
                    const fac = faculty.find(f => f.id === e.target.value);
                    if (fac) setFacultyForm(p => ({ ...p, facultyId: fac.id, facultyName: fac.full_name, department: fac.department, weeklyTeachingHours: fac.workload_hours, avgStudentFeedback: fac.teaching_rating, courseCount: fac.courses_taught?.length || 0, researchPublications: fac.research_publications }));
                    else setFacultyForm(p => ({ ...p, facultyId: e.target.value }));
                  }} className={inputCls}>
                    {faculty.length > 0
                      ? faculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)
                      : <option value="fac-201">Prof. Marcus Chen</option>
                    }
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Weekly Teaching Hrs</label>
                    <input type="number" min="0" max="80" value={facultyForm.weeklyTeachingHours} onChange={e => setFacultyForm(p => ({ ...p, weeklyTeachingHours: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Student Feedback (1-5)</label>
                    <input type="number" step="0.01" min="0" max="5" value={facultyForm.avgStudentFeedback} onChange={e => setFacultyForm(p => ({ ...p, avgStudentFeedback: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Course Count</label>
                    <input type="number" min="0" value={facultyForm.courseCount} onChange={e => setFacultyForm(p => ({ ...p, courseCount: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Research Publications</label>
                    <input type="number" min="0" value={facultyForm.researchPublications} onChange={e => setFacultyForm(p => ({ ...p, researchPublications: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {loading ? 'Analyzing...' : 'Generate Faculty Report'}
                </button>
              </form>
            )}

            {/* ─── DIAGNOSTIC FORM ─── */}
            {activeTab === 'diagnostic' && (
              <form onSubmit={runDiagnostic} className="space-y-4">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" /> Diagnostic Question Generator
                </h2>
                <div>
                  <label className={labelCls}>Entity Type</label>
                  <select value={diagForm.entityType} onChange={e => setDiagForm(p => ({ ...p, entityType: e.target.value }))} className={inputCls}>
                    {ENTITY_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Context / Anomaly Description</label>
                  <textarea
                    rows={4}
                    value={diagForm.context}
                    onChange={e => setDiagForm(p => ({ ...p, context: e.target.value }))}
                    className={inputCls}
                    placeholder="Describe the academic data anomaly or area requiring investigation..."
                  />
                </div>
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs shadow-lg transition-all disabled:opacity-60">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
                  {loading ? 'Generating...' : 'Generate Diagnostic Questions'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="glass-panel rounded-3xl p-10 border border-slate-800 flex flex-col items-center justify-center text-center space-y-3 min-h-[300px]">
              <div className="p-4 rounded-2xl bg-blue-600/10 text-blue-400">
                <Brain className="w-10 h-10" />
              </div>
              <h3 className="text-sm font-bold text-white">AI Engine Ready</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Fill in the form and click the generate button to receive an AI-powered academic analysis.
              </p>
            </div>
          )}

          {loading && (
            <div className="glass-panel rounded-3xl p-10 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
              <h3 className="text-sm font-bold text-blue-300">Gemini AI Processing...</h3>
              <p className="text-xs text-slate-400">Analyzing academic data and generating structured insights</p>
            </div>
          )}

          {/* ─── PREDICTION RESULT ─── */}
          {result?.type === 'predict' && (
            <AIInsightCard
              reportId={result.data.reportId}
              reportType="Prediction"
              title="Student Academic Risk Prediction"
              subtitle="AI-generated performance forecast based on CGPA, attendance, and assessment data"
              riskLevel={result.data.prediction?.riskLevel}
              confidenceScore={result.data.prediction?.confidenceScore}
              assumptions={result.data.prediction?.assumptions || []}
              onVerify={handleVerifyReport}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Predicted CGPA</p>
                    <p className="text-xl font-extrabold text-white">{result.data.prediction?.predictedCGPA?.toFixed(2)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Dropout Risk</p>
                    <p className="text-xl font-extrabold text-rose-400">{((result.data.prediction?.dropoutProbability || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Risk Classification</p>
                    <AlertBadge severity={result.data.prediction?.riskLevel} size="md" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Key Risk Factors
                    </h4>
                    <ul className="space-y-1.5">
                      {(result.data.prediction?.keyRiskFactors || []).map((r, i) => (
                        <li key={i} className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-red-500/5 border border-red-500/15 flex items-start gap-2">
                          <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Strengths Identified
                    </h4>
                    <ul className="space-y-1.5">
                      {(result.data.prediction?.strengths || []).map((s, i) => (
                        <li key={i} className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {(result.data.prediction?.possibleRootCauses || []).length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2">Possible Root Causes</h4>
                    <ul className="space-y-1.5">
                      {result.data.prediction.possibleRootCauses.map((c, i) => (
                        <li key={i} className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">{c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* ─── ADVISOR RESULT ─── */}
          {result?.type === 'advisor' && (
            <AIInsightCard
              reportId={result.data.reportId}
              reportType="Advisory"
              title="Personalized Academic Advisory Plan"
              subtitle="AI-generated study plan, intervention timeline, and course recommendations"
              confidenceScore={result.data.recommendations?.confidenceScore}
              assumptions={result.data.recommendations?.assumptions || []}
              onVerify={handleVerifyReport}
            >
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <Target className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-slate-400">Target GPA</p>
                    <p className="text-lg font-extrabold text-indigo-400">{result.data.recommendations?.targetGPA?.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Immediate Actions Required</h4>
                  <ul className="space-y-1.5">
                    {(result.data.recommendations?.immediateActions || []).map((a, i) => (
                      <li key={i} className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex gap-2">
                        <span className="font-bold text-indigo-400 flex-shrink-0">{i + 1}.</span>{a}
                      </li>
                    ))}
                  </ul>
                </div>

                {result.data.recommendations?.studyPlan && (
                  <div>
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-2">Study Plan</h4>
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-slate-300 space-y-2">
                      <p><span className="font-bold text-blue-400">Schedule:</span> {result.data.recommendations.studyPlan.weeklySchedule}</p>
                      {result.data.recommendations.studyPlan.studyTechniques?.map((t, i) => (
                        <p key={i}>• {t}</p>
                      ))}
                    </div>
                  </div>
                )}

                {(result.data.recommendations?.interventionTimeline || []).length > 0 && (
                  <div>
                    <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">Intervention Timeline</h4>
                    <div className="space-y-2">
                      {result.data.recommendations.interventionTimeline.map((t, i) => (
                        <div key={i} className="flex items-start gap-3 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">{t.week}</span>
                          <div>
                            <p className="text-[11px] text-slate-200">{t.milestone}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">Responsible: {t.responsible}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AIInsightCard>
          )}

          {/* ─── FACULTY RESULT ─── */}
          {result?.type === 'faculty' && (
            <AIInsightCard
              reportId={result.data.reportId}
              reportType="Faculty_Insight"
              title="Faculty Performance & Workload Diagnostic"
              subtitle="Teaching effectiveness rating, workload compliance, and burnout risk assessment"
              confidenceScore={result.data.insights?.confidenceScore}
              assumptions={result.data.insights?.assumptions || []}
              onVerify={handleVerifyReport}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Effectiveness', value: result.data.insights?.effectivenessRating, color: 'text-blue-400' },
                    { label: 'Workload', value: result.data.insights?.workloadStatus, color: 'text-yellow-400' },
                    { label: 'Burnout Risk', value: result.data.insights?.burnoutRisk, color: 'text-red-400' }
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-center">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">{item.label}</p>
                      <p className={`text-xs font-extrabold ${item.color}`}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Strengths</h4>
                  {(result.data.insights?.keyStrengths || []).map((s, i) => (
                    <p key={i} className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/15">✓ {s}</p>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Workload Recommendations</h4>
                  {(result.data.insights?.workloadRecommendations || []).map((r, i) => (
                    <p key={i} className="text-[11px] text-slate-300 p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15">{i + 1}. {r}</p>
                  ))}
                </div>

                {result.data.insights?.studentOutcomeImpact && (
                  <p className="text-[11px] text-slate-300 p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <span className="font-bold text-blue-400">Student Impact: </span>
                    {result.data.insights.studentOutcomeImpact}
                  </p>
                )}
              </div>
            </AIInsightCard>
          )}
        </div>
      </div>

      {/* Diagnostic Questions Modal */}
      <ModalContainer
        isOpen={diagnosticModal}
        onClose={() => setDiagnosticModal(false)}
        title="AI Diagnostic Questions"
        subtitle={`Data quality review for ${diagForm.entityType} — ${(result?.data?.diagnostics?.estimatedDataCompleteness * 100 || 35).toFixed(0)}% estimated data completeness`}
        maxWidth="xl"
      >
        {result?.type === 'diagnostic' && result.data.diagnostics && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-[11px] text-amber-300">
              These questions should be answered by institutional administrators before finalizing AI-generated reports.
            </div>

            <div className="space-y-3">
              {(result.data.diagnostics.diagnosticQuestions || []).map((q, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <p className="text-xs font-semibold text-white leading-relaxed">{q.question}</p>
                    <AlertBadge severity={q.priority} size="xs" />
                  </div>
                  <p className="text-[10px] text-slate-400">{q.rationale}</p>
                  <p className="text-[10px] text-blue-400 mt-1 font-semibold">Ask: {q.targetAudience}</p>
                </div>
              ))}
            </div>

            {(result.data.diagnostics.dataGapsIdentified || []).length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-2">Data Gaps Identified</h4>
                <ul className="space-y-1">
                  {result.data.diagnostics.dataGapsIdentified.map((g, i) => (
                    <li key={i} className="text-[11px] text-slate-300 flex items-start gap-2">
                      <span className="text-red-400 flex-shrink-0">•</span>{g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ModalContainer>
    </div>
  );
};

export default InsightsPage;
