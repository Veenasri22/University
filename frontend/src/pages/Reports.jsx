import React, { useState } from 'react';
import api from '../services/api.js';
import {
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building,
  Calendar,
  Layers
} from 'lucide-react';

export const Reports = () => {
  const [department, setDepartment] = useState('Computer Science');
  const [timeframe, setTimeframe] = useState('2026 Academic Year');
  const [reportType, setReportType] = useState('EXECUTIVE_AUDIT');

  const [generatedReport, setGeneratedReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/reports/generate', {
        department,
        timeframe,
        report_type: reportType
      });
      setGeneratedReport(res.report);
    } catch (err) {
      alert(err.message || 'Error generating report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadJSON = () => {
    if (!generatedReport) return;
    const blob = new Blob([JSON.stringify(generatedReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${department}_${reportType}_Report.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-500" />
          Automated Executive & Accreditation Report Generator
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          One-click generation of departmental audits, accreditation compliance, and leadership summaries powered by Gemini 2.5.
        </p>
      </div>

      {/* Configuration Form */}
      <form onSubmit={handleGenerateReport} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4 shadow-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target Department Scope</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Administration</option>
              <option value="Mechanical Engineering">Mechanical Engineering</option>
              <option value="Life Sciences">Life Sciences</option>
              <option value="Humanities">Humanities</option>
              <option value="ALL">All Departments Consolidated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Evaluation Timeframe</label>
            <input
              type="text"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              placeholder="e.g. 2026 Academic Year"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Report Archetype</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white"
            >
              <option value="EXECUTIVE_AUDIT">Executive Leadership Audit</option>
              <option value="ACCREDITATION">HLC Accreditation Compliance</option>
              <option value="FACULTY_EVALUATION">Faculty Workload & Sentiment Summary</option>
              <option value="STUDENT_RISK_SUMMARY">Student At-Risk Intervention Summary</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'Synthesizing Gemini Report...' : 'Generate Audit Report'}
          </button>
        </div>
      </form>

      {/* Report Display */}
      {generatedReport && (
        <div className="glass-panel rounded-3xl p-8 border border-slate-800 space-y-6 animate-fadeIn">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-6 gap-4">
            <div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                {generatedReport.complianceStatus || 'FULLY COMPLIANT'}
              </span>
              <h2 className="text-xl font-extrabold text-white font-outfit mt-2">{generatedReport.reportTitle}</h2>
              <p className="text-xs text-slate-400">Generated on {new Date().toLocaleDateString()}</p>
            </div>

            <button
              onClick={handleDownloadJSON}
              className="px-4 py-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white font-bold text-xs border border-blue-500/30 flex items-center gap-2 transition-all"
            >
              <Download className="w-4 h-4" />
              Download Report JSON
            </button>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Executive Overview</h3>
            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
              {generatedReport.executiveSummary}
            </p>
          </div>

          {/* Strengths & Concerns Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Demonstrated Key Strengths
              </h3>
              <ul className="space-y-2">
                {generatedReport.keyStrengths?.map((st, i) => (
                  <li key={i} className="p-3 rounded-xl bg-emerald-500/10 text-emerald-200 text-xs border border-emerald-500/20">
                    ✓ {st}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Identified Concerns & Vulnerabilities
              </h3>
              <ul className="space-y-2">
                {generatedReport.areasOfConcern?.map((ac, i) => (
                  <li key={i} className="p-3 rounded-xl bg-rose-500/10 text-rose-200 text-xs border border-rose-500/20">
                    ⚠ {ac}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider">Strategic Recommendations</h3>
            <div className="space-y-2">
              {generatedReport.actionableRecommendations?.map((rec, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900 text-xs text-slate-200 border border-slate-800 flex items-start gap-2">
                  <span className="font-bold text-blue-400">{i + 1}.</span>
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
