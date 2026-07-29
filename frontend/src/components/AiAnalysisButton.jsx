import React, { useState } from 'react';
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, HelpCircle, Database, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';
import api from '../services/api';

/**
 * AiAnalysisButton Component
 * Renders manual data entry form, AI Assessment generator, loading state,
 * and structured advisory results formatted with Tailwind CSS.
 *
 * @param {Object} props
 * @param {string} [props.initialEntityId] - Optional pre-filled entity ID
 * @param {string} [props.initialPayload] - Optional pre-filled user payload text
 * @param {function} [props.onAdvisoryGenerated] - Optional callback after generation
 */
export const AiAnalysisButton = ({ initialEntityId, initialPayload, onAdvisoryGenerated }) => {
  const [entityId, setEntityId] = useState(
    initialEntityId || 'b2c3d4e5-0001-4000-8000-000000000001'
  );
  const [payload, setPayload] = useState(
    initialPayload || ''
  );
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultRecord, setResultRecord] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleGenerateAssessment = async (e) => {
    if (e) e.preventDefault();

    if (!entityId.trim()) {
      setError('Please enter a valid Entity ID (UUID).');
      return;
    }

    if (!payload.trim()) {
      setError('Please enter user data / payload details manually before generating AI Assessment.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // POST request to /api/generate-advisory as requested
      const response = await api.post('/generate-advisory', {
        entityId: entityId.trim(),
        payload: payload.trim()
      });

      if (response && response.success && response.data) {
        setResultRecord(response.data);
        if (onAdvisoryGenerated) {
          onAdvisoryGenerated(response.data);
        }
      } else if (response && response.data) {
        setResultRecord(response.data);
      } else {
        throw new Error(response?.message || 'Failed to generate advisory.');
      }
    } catch (err) {
      console.error('[AI Analysis Error]', err);
      setError(err.error || err.message || 'Error connecting to AI Analysis API server.');
    } finally {
      setLoading(false);
    }
  };

  const advisory = resultRecord?.ai_output_json || null;

  // Helper for risk badge styling
  const getRiskBadge = (risk) => {
    const r = (risk || 'LOW').toUpperCase();
    if (r === 'HIGH') {
      return {
        bg: 'bg-rose-500/15 border-rose-500/30 text-rose-400',
        dot: 'bg-rose-400 animate-pulse',
        label: 'HIGH RISK ASSESSMENT'
      };
    }
    if (r === 'MEDIUM') {
      return {
        bg: 'bg-amber-500/15 border-amber-500/30 text-amber-400',
        dot: 'bg-amber-400',
        label: 'MEDIUM RISK ASSESSMENT'
      };
    }
    return {
      bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400',
      dot: 'bg-emerald-400',
      label: 'LOW RISK ASSESSMENT'
    };
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              AI Academic Advisory Engine
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/50">
                gemini-2.5-flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Enter user details manually below to generate and store structured AI assessments in PostgreSQL.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 transition-colors"
        >
          {isExpanded ? 'Minimize Form' : 'Expand Form'}
        </button>
      </div>

      {/* Manual User Data Input Form */}
      {isExpanded && (
        <form onSubmit={handleGenerateAssessment} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Target Entity ID (UUID) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={entityId}
                onChange={(e) => setEntityId(e.target.value)}
                placeholder="e.g. b2c3d4e5-0001-4000-8000-000000000001"
                required
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Manual User Performance Data / Payload <span className="text-rose-400">*</span>
              </label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                rows={3}
                placeholder="Type or paste manual student data, midterm scores, attendance %, advisor notes, or academic flags..."
                required
                className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>

          {/* Action Trigger Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              Saves automatically to <code className="text-slate-300 font-mono">ai_generated_advisories</code>
            </div>

            <button
              type="submit"
              disabled={loading || !entityId.trim() || !payload.trim()}
              className="relative inline-flex items-center justify-center px-6 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                  Generating AI Assessment...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate AI Assessment
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-3 mb-5">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-200">Assessment Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result Display Card */}
      {advisory && (
        <div className="space-y-5 pt-4 border-t border-slate-800 animate-fadeIn">
          {/* Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center space-x-3">
              {(() => {
                const badge = getRiskBadge(advisory.riskLevel);
                return (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${badge.bg}`}>
                    <span className={`w-2 h-2 rounded-full mr-2 ${badge.dot}`} />
                    {badge.label}
                  </span>
                );
              })()}
              <span className="text-xs text-slate-400 font-mono">
                Entity: <span className="text-slate-200">{resultRecord.entity_id}</span>
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Record ID: {resultRecord.id ? resultRecord.id.substring(0, 8) + '...' : 'Saved'}</span>
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-400" />
              Executive Summary
            </h4>
            <p className="text-xs leading-relaxed text-slate-200">
              {advisory.summary}
            </p>
          </div>

          {/* Grid Layout for Action Steps & Follow Up Questions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Steps */}
            <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Action Steps ({advisory.actionSteps?.length || 0})
              </h4>
              <ul className="space-y-2">
                {advisory.actionSteps && advisory.actionSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Follow Up Questions */}
            <div className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/80">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                Follow-Up Questions ({advisory.followUpQuestions?.length || 0})
              </h4>
              <ul className="space-y-2">
                {advisory.followUpQuestions && advisory.followUpQuestions.map((q, idx) => (
                  <li key={idx} className="flex items-start space-x-2 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-amber-400 font-bold shrink-0">Q{idx + 1}.</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAnalysisButton;
