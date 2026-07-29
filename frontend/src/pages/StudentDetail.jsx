import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import {
  User,
  Brain,
  Sparkles,
  ArrowLeft,
  Calendar,
  BookOpen,
  Award,
  AlertOctagon,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

export const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [advisoryLogs, setAdvisoryLogs] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Gemini Risk Prediction State
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  // Performance Edit State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    current_gpa: 3.0,
    attendance_rate: 85.0,
    advisor_notes: ''
  });

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/students/${id}`);
      setStudent(res.student);
      setAdvisoryLogs(res.advisoryLogs || []);
      setAttendanceLogs(res.attendanceLogs || []);
      setEditForm({
        current_gpa: res.student.current_gpa,
        attendance_rate: res.student.attendance_rate,
        advisor_notes: res.student.advisor_notes || ''
      });
    } catch (e) {
      console.warn('[StudentDetail] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handlePredictRisk = async () => {
    try {
      setPredicting(true);
      const res = await api.post(`/students/${id}/predict-performance`);
      setPrediction(res.prediction);
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Gemini prediction error');
    } finally {
      setPredicting(false);
    }
  };

  const handleUpdatePerformance = async (e) => {
    e.preventDefault();
    try {
      const res = await api.patch(`/students/${id}/performance`, editForm);
      setIsEditOpen(false);
      if (res.aiPrediction) {
        setPrediction(res.aiPrediction);
      }
      fetchDetail();
    } catch (err) {
      alert(err.message || 'Update failed');
    }
  };

  if (loading || !student) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        Loading detailed student academic trajectory...
      </div>
    );
  }

  const gpaData = student.gpa_history || [
    { term: 'Fall 2024', gpa: 3.10 },
    { term: 'Spring 2025', gpa: student.current_gpa }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={() => navigate('/students')}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Student Directory
      </button>

      {/* Main Profile Header */}
      <div className="glass-panel rounded-3xl p-6 md:p-8 border border-slate-800 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 border-2 border-blue-400/30 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl">
              {student.full_name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-extrabold text-white font-outfit">{student.full_name}</h1>
                <RiskBadge riskLevel={student.predicted_risk} />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {student.student_code} • {student.department} • Class of {student.enrollment_year + 4}
              </p>
              <div className="flex items-center gap-4 mt-3 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  Cumulative GPA: <strong className="text-white">{student.current_gpa}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  Attendance Rate: <strong className="text-white">{student.attendance_rate}%</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  Credits: <strong className="text-white">{student.credits_earned || 48} / {student.credits_required || 120}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handlePredictRisk}
              disabled={predicting}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
            >
              <Brain className="w-4 h-4" />
              {predicting ? 'Computing Gemini AI Trajectory...' : 'Run Gemini Risk Evaluation'}
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all"
            >
              Update Performance Metrics
            </button>
          </div>
        </div>
      </div>

      {/* AI Risk Prediction Results Box */}
      {prediction && (
        <div className="glass-panel rounded-3xl p-6 border border-blue-500/30 bg-blue-950/20 relative animate-fadeIn space-y-4">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-outfit">Gemini 2.5 Risk Trajectory Assessment</h3>
                <p className="text-xs text-blue-300">Predictive ML Model Analysis Result</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-300">Forecasted GPA:</span>
              <span className="text-lg font-extrabold text-white px-3 py-1 rounded-xl bg-blue-600/30 border border-blue-500/40">
                {prediction.predictedGpa?.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Risk Factors */}
            <div className="space-y-2">
              <h4 className="font-bold text-rose-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <AlertOctagon className="w-4 h-4" /> Primary Risk Factors
              </h4>
              <ul className="space-y-1.5">
                {prediction.primaryRiskFactors?.map((rf, i) => (
                  <li key={i} className="p-2 rounded-lg bg-rose-500/10 text-rose-200 border border-rose-500/20">
                    • {rf}
                  </li>
                ))}
              </ul>
            </div>

            {/* Interventions */}
            <div className="space-y-2">
              <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <CheckCircle className="w-4 h-4" /> Recommended Interventions
              </h4>
              <ul className="space-y-1.5">
                {prediction.recommendedInterventions?.map((inv, i) => (
                  <li key={i} className="p-2 rounded-lg bg-emerald-500/10 text-emerald-200 border border-emerald-500/20">
                    ✓ {inv}
                  </li>
                ))}
              </ul>
            </div>

            {/* Advisor Questions */}
            <div className="space-y-2">
              <h4 className="font-bold text-amber-400 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <HelpCircle className="w-4 h-4" /> Recommended Advisor Questions
              </h4>
              <ul className="space-y-1.5">
                {prediction.advisorQuestions?.map((q, i) => (
                  <li key={i} className="p-2 rounded-lg bg-amber-500/10 text-amber-200 border border-amber-500/20">
                    ? {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Grid for GPA Chart & Advisor Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* GPA Trajectory Chart */}
        <div className="lg:col-span-2 glass-panel rounded-3xl p-6 border border-slate-800">
          <h3 className="text-sm font-bold text-white mb-4">Historical Term GPA Trend</h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={gpaData}>
                <XAxis dataKey="term" stroke="#64748b" fontSize={11} />
                <YAxis domain={[1.5, 4.0]} stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
                <Line type="monotone" dataKey="gpa" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Advisor Notes & Standing */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white">Advisor Audit Notes</h3>
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed min-h-[140px]">
            {student.advisor_notes || 'No faculty advisor notes recorded for current academic semester.'}
          </div>
          <button
            onClick={() => navigate('/ai-advisor')}
            className="w-full py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Discuss Trajectory with AI Advisor
          </button>
        </div>
      </div>

      {/* Update Performance Modal */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="Update Student Performance Log">
        <form onSubmit={handleUpdatePerformance} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Current Cumulative GPA</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="4.0"
              required
              value={editForm.current_gpa}
              onChange={(e) => setEditForm({ ...editForm, current_gpa: parseFloat(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Attendance Percentage (%)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={editForm.attendance_rate}
              onChange={(e) => setEditForm({ ...editForm, attendance_rate: parseFloat(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Advisor Observation Notes</label>
            <textarea
              rows="3"
              value={editForm.advisor_notes}
              onChange={(e) => setEditForm({ ...editForm, advisor_notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              placeholder="Record recent midterm exam scores, attendance patterns..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500"
            >
              Save & Recalculate Risk
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
