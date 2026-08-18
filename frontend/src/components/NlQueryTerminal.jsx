import React, { useState } from 'react';
import api from '../services/api.js';
import { Terminal, Sparkles, Send, RefreshCw, ChevronRight, Brain, AlertCircle } from 'lucide-react';

export const NlQueryTerminal = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);

  const sampleQueries = [
    'Which department has the highest failure rate in 3rd semester?',
    'Show overall student attendance average and high risk count.',
    'Summarize curriculum completion pace across CSE and ECE.'
  ];

  const handleRunQuery = async (queryText) => {
    const textToRun = queryText || query;
    if (!textToRun.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/ai/analytics-query', { query: textToRun });
      setResponse(res);
    } catch (err) {
      alert(err.message || 'Error running natural language query');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-indigo-500/20 bg-slate-950/80 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white font-outfit flex items-center gap-2">
              Natural Language University Analytics Terminal
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Groq llama-3.3-70b
              </span>
            </h3>
            <p className="text-xs text-slate-400">Ask any question in plain English for instant parameter-driven insights.</p>
          </div>
        </div>
      </div>

      {/* Preset Query Chips */}
      <div className="flex flex-wrap gap-2">
        {sampleQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setQuery(q);
              handleRunQuery(q);
            }}
            className="text-[11px] font-semibold px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleRunQuery();
        }}
        className="relative flex items-center"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask e.g. 'Which department needs urgent attendance intervention?'"
          className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-4 pr-28 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          {loading ? 'Analyzing...' : 'Run Query'}
        </button>
      </form>

      {/* AI Response Output */}
      {response && (
        <div className="bg-slate-900/90 rounded-2xl p-5 border border-indigo-500/30 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
              <Brain className="w-4 h-4" /> Synthesis Output:
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">
              Confidence Score: {(response.confidenceScore * 100).toFixed(0)}%
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3 rounded-xl border border-slate-800">
            "{response.summary}"
          </p>

          {response.insights && response.insights.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Key Data Findings:</span>
              <ul className="space-y-1">
                {response.insights.map((insight, idx) => (
                  <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
