import React from 'react';
import { ShieldAlert, ShieldCheck, AlertTriangle } from 'lucide-react';

export const RiskBadge = ({ riskLevel }) => {
  let bg = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  let icon = <ShieldCheck className="w-3.5 h-3.5 mr-1" />;
  let label = 'Low Risk';

  if (riskLevel === 'HIGH') {
    bg = 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse';
    icon = <ShieldAlert className="w-3.5 h-3.5 mr-1 text-rose-400" />;
    label = 'High Risk (Critical)';
  } else if (riskLevel === 'MEDIUM') {
    bg = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    icon = <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-400" />;
    label = 'Moderate Risk';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${bg}`}>
      {icon}
      {label}
    </span>
  );
};
