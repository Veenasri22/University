import React from 'react';
import { ShieldCheck, ShieldX, AlertTriangle, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  Critical: {
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-500',
    icon: ShieldX,
    pulse: 'animate-pulse'
  },
  High: {
    bg: 'bg-orange-500/10 border-orange-500/30',
    text: 'text-orange-400',
    dot: 'bg-orange-500',
    icon: AlertTriangle,
    pulse: ''
  },
  Moderate: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    icon: Info,
    pulse: ''
  },
  Low: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    text: 'text-blue-400',
    dot: 'bg-blue-400',
    icon: Info,
    pulse: ''
  },
  'On-Track': {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    icon: ShieldCheck,
    pulse: ''
  },
  // Legacy aliases
  HIGH: {
    bg: 'bg-red-500/10 border-red-500/30',
    text: 'text-red-400',
    dot: 'bg-red-500',
    icon: ShieldX,
    pulse: ''
  },
  MEDIUM: {
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    text: 'text-yellow-400',
    dot: 'bg-yellow-500',
    icon: AlertTriangle,
    pulse: ''
  },
  LOW: {
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-500',
    icon: ShieldCheck,
    pulse: ''
  }
};

/**
 * AlertBadge — Color-coded severity chip.
 * severity: 'Critical' | 'High' | 'Moderate' | 'Low' | 'On-Track' | 'HIGH' | 'MEDIUM' | 'LOW'
 */
export const AlertBadge = ({ severity, size = 'sm', showIcon = true, className = '' }) => {
  const config = SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.Moderate;
  const Icon = config.icon;

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px] gap-1',
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3 py-1.5 text-sm gap-2'
  }[size] || 'px-2.5 py-1 text-xs gap-1.5';

  return (
    <span
      className={`inline-flex items-center font-bold rounded-full border ${config.bg} ${config.text} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dot} ${config.pulse}`} />
      {showIcon && <Icon className="w-3 h-3 flex-shrink-0" />}
      <span>{severity}</span>
    </span>
  );
};

export default AlertBadge;
