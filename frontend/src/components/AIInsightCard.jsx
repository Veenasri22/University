import React, { useState } from 'react';
import { AlertBadge } from './AlertBadge.jsx';
import {
  Brain,
  ShieldCheck,
  ShieldX,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Info,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

/**
 * AIInsightCard — Strategic card for AI-generated predictions and reports.
 *
 * Props:
 *   reportId: string
 *   reportType: 'Prediction' | 'Advisory' | 'Faculty_Insight' | 'Executive_Summary'
 *   riskLevel?: string — for prediction cards
 *   confidenceScore?: number (0-1)
 *   isVerified?: boolean
 *   onVerify?: (reportId: string) => Promise<void>
 *   children: ReactNode — main content body
 *   title: string
 *   subtitle?: string
 *   assumptions?: string[]
 *   className?: string
 */
export const AIInsightCard = ({
  reportId,
  reportType,
  riskLevel,
  confidenceScore,
  isVerified = false,
  onVerify,
  children,
  title,
  subtitle,
  assumptions = [],
  className = ''
}) => {
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(isVerified);

  const handleVerify = async () => {
    if (!onVerify || verified) return;
    setVerifying(true);
    try {
      await onVerify(reportId);
      setVerified(true);
    } finally {
      setVerifying(false);
    }
  };

  const confidencePct = confidenceScore != null ? Math.round(confidenceScore * 100) : null;
  const confidenceColor = confidencePct >= 80 ? 'text-emerald-400' : confidencePct >= 60 ? 'text-yellow-400' : 'text-red-400';
  const confidenceBg = confidencePct >= 80 ? 'bg-emerald-500' : confidencePct >= 60 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div className={`glass-panel rounded-3xl border border-slate-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between p-5 border-b border-slate-800 gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="p-2.5 rounded-xl bg-blue-600/15 text-blue-400 flex-shrink-0 mt-0.5">
            <Brain className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold text-white font-outfit">{title}</h3>
              {reportType && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold uppercase tracking-wider">
                  {reportType.replace(/_/g, ' ')}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {riskLevel && <AlertBadge severity={riskLevel} />}

          {confidencePct != null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${confidenceBg}`}
                  style={{ width: `${confidencePct}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold ${confidenceColor}`}>{confidencePct}%</span>
              <span className="text-[10px] text-slate-500">confidence</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {children}
      </div>

      {/* Assumptions Section */}
      {assumptions.length > 0 && (
        <div className="px-5 pb-2">
          <button
            onClick={() => setShowAssumptions(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-semibold transition-colors py-2"
          >
            <Info className="w-3.5 h-3.5" />
            {assumptions.length} AI Assumptions
            {showAssumptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showAssumptions && (
            <div className="pb-3 space-y-1.5">
              {assumptions.map((a, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-slate-400 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-blue-400 font-bold flex-shrink-0 mt-0.5">{i + 1}.</span>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer: Disclaimer + Verification */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 bg-slate-900/40 border-t border-slate-800 gap-3">
        <div className="flex items-start gap-2 text-[11px] text-amber-400/80 flex-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
          <span>AI-generated. Requires institutional administrator verification before any academic action.</span>
        </div>

        {onVerify && (
          <button
            onClick={handleVerify}
            disabled={verified || verifying}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all flex-shrink-0 ${
              verified
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-not-allowed'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-blue-600 hover:border-blue-500 hover:text-white'
            }`}
          >
            {verified
              ? <><ShieldCheck className="w-3.5 h-3.5" /> Verified by Admin</>
              : verifying
                ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-white animate-spin" /> Verifying...</>
                : <><ShieldX className="w-3.5 h-3.5" /> Mark as Verified</>
            }
          </button>
        )}
      </div>
    </div>
  );
};

export default AIInsightCard;
