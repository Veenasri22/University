import React, { useState } from 'react';
import api from '../services/api.js';
import { AiAnalysisButton } from '../components/AiAnalysisButton.jsx';
import {
  Bot,
  Send,
  Calendar,
  Mail,
  Sparkles,
  BookOpen,
  DollarSign,
  Briefcase,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';


export const AIAdvisor = () => {
  const [agentType, setAgentType] = useState('COURSE_PLANNER');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      agent: 'COURSE_PLANNER',
      text: 'Hello! I am your AI Course Planner Agent. How can I assist with your degree audit, course dependencies, or recovery plan today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mcpEvent, setMcpEvent] = useState(null);

  const agents = [
    { id: 'COURSE_PLANNER', name: 'Course Planner Agent', icon: BookOpen, desc: 'Degree roadmap & prerequisite dependencies' },
    { id: 'FINANCIAL_AID', name: 'Financial Aid Policy Agent', icon: DollarSign, desc: 'SAP compliance & scholarship criteria' },
    { id: 'CAREER_PATHWAY', name: 'Career Pathway Agent', icon: Briefcase, desc: 'Research grants & industry internships' },
    { id: 'GENERAL', name: 'General Academic Agent', icon: Bot, desc: 'University handbook & grading standards' }
  ];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/advisor-chat', {
        message: currentInput,
        agent_type: agentType,
        chat_history: messages.map((m) => ({ sender: m.sender, text: m.text }))
      });

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          agent: res.agent,
          text: res.reply,
          citations: res.citations
        }
      ]);

      if (res.mcpAction) {
        setMcpEvent(res.mcpAction);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          agent: agentType,
          text: 'I encountered an issue accessing policy data. Please try rephrasing your prompt.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-blue-500/20">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white font-outfit">Multi-Agent Academic Advisor Network</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a specialized agent powered by Gemini 2.5 Flash & Enterprise Policy RAG context.
            </p>
          </div>
        </div>

        {/* Agent Selector Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          {agents.map((ag) => {
            const Icon = ag.icon;
            const isSelected = agentType === ag.id;
            return (
              <button
                key={ag.id}
                onClick={() => setAgentType(ag.id)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg shadow-blue-600/10'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold truncate">{ag.name}</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-tight">{ag.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual AI Assessment & Advisory Generator Component */}
      <AiAnalysisButton />

      {/* MCP Action Notification Box */}
      {mcpEvent && (
        <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 bg-emerald-950/20 flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">MCP Connector Action Triggered</h4>
              <p className="text-[11px] text-emerald-300">
                {mcpEvent.eventId ? (
                  <>Google Calendar Event Scheduled: <strong>{mcpEvent.summary}</strong> (<a href={mcpEvent.meet_link} target="_blank" rel="noreferrer" className="underline font-bold">Google Meet Link</a>)</>
                ) : (
                  <>Gmail Alert Dispatched to <strong>{mcpEvent.recipient}</strong></>
                )}
              </p>
            </div>
          </div>
          <button onClick={() => setMcpEvent(null)} className="text-xs font-bold text-slate-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Chat Conversation Box */}
      <div className="glass-panel rounded-3xl border border-slate-800 flex flex-col h-[520px] overflow-hidden">
        {/* Chat History Messages */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-md shadow-blue-600/20'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">
                    <Bot className="w-3.5 h-3.5" />
                    <span>{msg.agent || agentType}</span>
                  </div>
                )}

                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.citations && msg.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                    <span className="font-bold uppercase tracking-wider text-blue-400">Institutional Policy Citations:</span>
                    {msg.citations.map((c, ci) => (
                      <div key={ci} className="flex items-center gap-1 text-slate-300">
                        • <span>{c.title}</span> ({c.category})
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-blue-400 font-semibold italic">
              <Bot className="w-4 h-4 animate-bounce" />
              <span>{agentType} Agent is querying RAG policy embeddings and evaluating trajectory...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`Ask ${agentType} Agent (e.g. "Schedule an advising slot", "Can I repeat CS201?", "Title IV SAP rules")...`}
            className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-2 transition-all"
          >
            <span>Send</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
