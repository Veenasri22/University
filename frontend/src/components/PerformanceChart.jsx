import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell
} from 'recharts';

const DARK_TOOLTIP_STYLE = {
  backgroundColor: '#0f172a',
  borderColor: '#334155',
  borderRadius: '12px',
  fontSize: '12px',
  color: '#e2e8f0'
};

const DARK_AXIS_STYLE = { stroke: '#64748b', fontSize: 11, fill: '#64748b' };

const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

/**
 * PerformanceChart — Reusable Recharts wrapper with dark-theme presets.
 *
 * Props:
 *   data: array of objects
 *   type: 'area' | 'bar' | 'line'
 *   xKey: string — the data key for X axis
 *   yKeys: Array<{ key: string, label: string, color?: string }> — data series
 *   height?: number (default 240)
 *   domain?: [number, number] — Y axis domain
 *   showGrid?: boolean
 *   showLegend?: boolean
 *   gradient?: boolean — fill area charts with gradient
 */
export const PerformanceChart = ({
  data = [],
  type = 'bar',
  xKey,
  yKeys = [],
  height = 240,
  domain,
  showGrid = false,
  showLegend = false,
  gradient = true
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-slate-500 italic">
        No chart data available
      </div>
    );
  }

  const gradientDefs = gradient && (
    <defs>
      {yKeys.map((yk, i) => {
        const color = yk.color || CHART_COLORS[i % CHART_COLORS.length];
        return (
          <linearGradient key={yk.key} id={`grad_${yk.key}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.35} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        );
      })}
    </defs>
  );

  const commonProps = {
    data,
    margin: { top: 4, right: 8, left: -16, bottom: 0 }
  };

  const xAxis = <XAxis dataKey={xKey} tick={DARK_AXIS_STYLE} axisLine={false} tickLine={false} />;
  const yAxis = <YAxis domain={domain} tick={DARK_AXIS_STYLE} axisLine={false} tickLine={false} />;
  const tooltipEl = <Tooltip contentStyle={DARK_TOOLTIP_STYLE} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />;
  const gridEl = showGrid ? <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" /> : null;
  const legendEl = showLegend ? <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} /> : null;

  if (type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart {...commonProps}>
          {gradientDefs}
          {gridEl}
          {xAxis}
          {yAxis}
          {tooltipEl}
          {legendEl}
          {yKeys.map((yk, i) => {
            const color = yk.color || CHART_COLORS[i % CHART_COLORS.length];
            return (
              <Area
                key={yk.key}
                type="monotone"
                dataKey={yk.key}
                name={yk.label || yk.key}
                stroke={color}
                strokeWidth={2.5}
                fillOpacity={gradient ? 1 : 0}
                fill={gradient ? `url(#grad_${yk.key})` : 'transparent'}
                dot={{ fill: color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            );
          })}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart {...commonProps}>
          {gridEl}
          {xAxis}
          {yAxis}
          {tooltipEl}
          {legendEl}
          {yKeys.map((yk, i) => {
            const color = yk.color || CHART_COLORS[i % CHART_COLORS.length];
            return (
              <Line
                key={yk.key}
                type="monotone"
                dataKey={yk.key}
                name={yk.label || yk.key}
                stroke={color}
                strokeWidth={2.5}
                dot={{ fill: color, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            );
          })}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Default: bar
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart {...commonProps}>
        {gridEl}
        {xAxis}
        {yAxis}
        {tooltipEl}
        {legendEl}
        {yKeys.map((yk, i) => {
          const color = yk.color || CHART_COLORS[i % CHART_COLORS.length];
          return (
            <Bar
              key={yk.key}
              dataKey={yk.key}
              name={yk.label || yk.key}
              fill={color}
              radius={[4, 4, 0, 0]}
            />
          );
        })}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default PerformanceChart;
