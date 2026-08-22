import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, Send, Sparkles, User, Plus, RefreshCw, Trash2,
  BookOpen, GraduationCap, ShieldCheck, Copy, Check,
  Zap, MessageSquare, ChevronRight, CornerDownLeft, AlertCircle, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../services/api.js';

const ROLE_METADATA = {
  STUDENT: {
    title: 'Student AI Academic Mentor',
    subtitle: 'Socratic Concept Clarification & Study Co-Pilot',
    icon: GraduationCap,
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    avatarBg: 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400',
    accentColor: 'text-emerald-400',
    prompts: [
      'Explain the Fourier Transform using an intuitive music analogy.',
      'Help me design a 5-day study roadmap for Database Systems.',
      'Can you give me a hint on solving a Dijkstra graph problem?'
    ]
  },
  FACULTY: {
    title: 'Faculty Teaching Co-Pilot',
    subtitle: 'Curriculum Architect & Exam Bank Generator',
    icon: BookOpen,
    badgeBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    avatarBg: 'bg-indigo-600/20 border-indigo-500/30 text-indigo-400',
    accentColor: 'text-indigo-400',
    prompts: [
      'Generate 3 Bloom-taxonomy exam questions on Distributed Systems.',
      'Draft a criterion-referenced grading rubric for a Capstone project.',
      'Formulate a 4-week module syllabus for Machine Learning Lab.'
    ]
  },
  DEPARTMENT_HEAD: {
    title: 'Department Curriculum Advisor',
    subtitle: 'Curriculum Mapping & Faculty Workload Assistant',
    icon: BookOpen,
    badgeBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    avatarBg: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400',
    accentColor: 'text-cyan-400',
    prompts: [
      'Review syllabus completion rate and suggest remediation strategies.',
      'Draft departmental faculty meeting agenda on ABET accreditation.',
      'Analyze student attendance trends across semester cohorts.'
    ]
  },
  DEAN: {
    title: 'Dean Executive Governance Advisor',
    subtitle: 'Strategic Policy, Accreditation & Institutional Intelligence',
    icon: ShieldCheck,
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    avatarBg: 'bg-amber-600/20 border-amber-500/30 text-amber-400',
    accentColor: 'text-amber-400',
    prompts: [
      'Draft an institutional memo regarding faculty research grant quotas.',
      'Evaluate retention risks across high-enrollment engineering programs.',
      'Synthesize an executive briefing for the upcoming Academic Senate.'
    ]
  },
  SUPER_ADMIN: {
    title: 'Executive Institutional Advisor',
    subtitle: 'High-Level Governance & Resource Strategy',
    icon: ShieldCheck,
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    avatarBg: 'bg-amber-600/20 border-amber-500/30 text-amber-400',
    accentColor: 'text-amber-400',
    prompts: [
      'Synthesize institutional KPIs for annual university board review.',
      'Evaluate multi-department resource allocations and faculty load.',
      'Draft university-wide policy on responsible generative AI adoption.'
    ]
  },
  ADMIN: {
    title: 'Executive Institutional Advisor',
    subtitle: 'Administrative Intelligence & Governance',
    icon: ShieldCheck,
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    avatarBg: 'bg-amber-600/20 border-amber-500/30 text-amber-400',
    accentColor: 'text-amber-400',
    prompts: [
      'Summarize academic probation policies and recommended interventions.',
      'Draft guidelines for semester credit transfers and waivers.',
      'Review university audit compliance guidelines.'
    ]
  }
};

/**
 * Rich Markdown & Math Formatter
 */
export function MarkdownRenderer({ content }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!content) return null;

  const handleCopyCode = (codeText, idx) => {
    navigator.clipboard.writeText(codeText);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Split by code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-sm text-slate-200">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const firstLineEnd = part.indexOf('\n');
          const lang = firstLineEnd !== -1 ? part.slice(3, firstLineEnd).trim() : '';
          const code = firstLineEnd !== -1 ? part.slice(firstLineEnd + 1, -3) : part.slice(3, -3);

          return (
            <div key={index} className="relative my-3 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 font-mono text-xs shadow-lg">
              <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-slate-400 text-[11px]">
                <span className="font-semibold uppercase tracking-wider text-slate-300">{lang || 'CODE'}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(code, index)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-[11px]"
                >
                  {copiedIndex === index ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-cyan-300 leading-relaxed scrollbar-thin">
                <code>{code}</code>
              </pre>
            </div>
          );
        }

        // Inline text formatting (headings, bold, lists, math, bullet points)
        const lines = part.split('\n');
        return (
          <div key={index} className="space-y-1.5">
            {lines.map((line, lIdx) => {
              if (!line.trim()) return <div key={lIdx} className="h-1" />;

              // Headings
              if (line.startsWith('### ')) {
                return <h3 key={lIdx} className="text-base font-bold text-white pt-2 pb-1">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('## ')) {
                return <h2 key={lIdx} className="text-lg font-extrabold text-white pt-3 pb-1 border-b border-slate-800">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('# ')) {
                return <h1 key={lIdx} className="text-xl font-black text-white pt-3 pb-1.5">{line.replace('# ', '')}</h1>;
              }

              // Bullet points
              if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                const bulletContent = line.trim().substring(2);
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-cyan-400 mt-1 font-bold">•</span>
                    <span>{formatInlineStyles(bulletContent)}</span>
                  </div>
                );
              }

              // Numbered lists
              const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-2">
                    <span className="text-blue-400 font-semibold">{numMatch[1]}.</span>
                    <span>{formatInlineStyles(numMatch[2])}</span>
                  </div>
                );
              }

              // Blockquotes
              if (line.startsWith('> ')) {
                return (
                  <blockquote key={lIdx} className="pl-3 py-1 border-l-2 border-cyan-500/80 bg-cyan-950/20 text-cyan-200 rounded-r-lg italic my-1">
                    {formatInlineStyles(line.replace('> ', ''))}
                  </blockquote>
                );
              }

              return <p key={lIdx}>{formatInlineStyles(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

function formatInlineStyles(text) {
  // Bold formatting **text**
  const boldParts = text.split(/(\*\*.*?\*\*)/g);
  return boldParts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    // Inline code `code`
    const codeParts = part.split(/(`.*?`)/g);
    return codeParts.map((cPart, cIdx) => {
      if (cPart.startsWith('`') && cPart.endsWith('`')) {
        return (
          <code key={cIdx} className="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700">
            {cPart.slice(1, -1)}
          </code>
        );
      }
      return cPart;
    });
  });
}

/**
 * Role-Aware AI Chat Drawer / Full-Screen Component
 */
export default function RoleChatDrawer({ defaultOpen = true, embedded = false }) {
  const { user } = useAuth();
  const rawRole = (user?.role || 'STUDENT').toUpperCase();
  const config = ROLE_METADATA[rawRole] || ROLE_METADATA.STUDENT;
  const RoleIcon = config.icon;

  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isStreaming]);

  // Load chat sessions on mount
  useEffect(() => {
    fetchSessions();
  }, [user?.id]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/ai/chat-sessions');
      if (res && res.success && Array.isArray(res.sessions)) {
        setSessions(res.sessions);
      }
    } catch (e) {
      console.warn('[RoleChat] Could not load chat sessions:', e);
    }
  };

  const handleSelectSession = async (sessId) => {
    if (isStreaming) return;
    setActiveSessionId(sessId);
    setError(null);
    try {
      const res = await api.get(`/ai/chat-sessions/${sessId}/messages`);
      if (res && res.success && Array.isArray(res.messages)) {
        setMessages(res.messages.map(m => ({
          id: m.id,
          role: m.role,
          content: m.content,
          created_at: m.created_at
        })));
      }
    } catch (e) {
      console.error('[RoleChat] Failed to load messages:', e);
    }
  };

  const handleNewChat = () => {
    if (isStreaming) return;
    setActiveSessionId(null);
    setMessages([]);
    setInput('');
    setError(null);
    inputRef.current?.focus();
  };

  const handleDeleteSession = async (sessId, e) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/chat-sessions/${sessId}`);
      setSessions(prev => prev.filter(s => s.id !== sessId));
      if (activeSessionId === sessId) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSendMessage = async (customPrompt) => {
    const textToSend = typeof customPrompt === 'string' ? customPrompt : input;
    if (!textToSend || !textToSend.trim() || isStreaming) return;

    const userText = textToSend.trim();
    setInput('');
    setError(null);

    const token = localStorage.getItem('uni_auth_token');

    // Optimistic UI updates
    const tempUserMsg = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: userText,
      created_at: new Date().toISOString()
    };

    const tempAssistantMsg = {
      id: 'ast-' + Date.now(),
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg, tempAssistantMsg]);
    setIsStreaming(true);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';
      const response = await fetch(`${apiBase}/ai/chat-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: userText,
          sessionId: activeSessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let streamedAssistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const sseLines = rawChunk.split('\n');

        for (const line of sseLines) {
          if (line.startsWith('data: ')) {
            const jsonString = line.slice(6).trim();
            if (!jsonString) continue;

            try {
              const eventData = JSON.parse(jsonString);

              if (eventData.type === 'session_init') {
                if (eventData.sessionId && eventData.sessionId !== activeSessionId) {
                  setActiveSessionId(eventData.sessionId);
                  fetchSessions();
                }
              } else if (eventData.type === 'token') {
                streamedAssistantText += eventData.content;
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: streamedAssistantText
                  };
                  return copy;
                });
              } else if (eventData.type === 'error') {
                setError(eventData.error);
                streamedAssistantText += `\n\n*[Error: ${eventData.error}]*`;
                setMessages(prev => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: streamedAssistantText
                  };
                  return copy;
                });
              }
            } catch (pErr) {
              // Ignore line parse edge cases
            }
          }
        }
      }

      fetchSessions();
    } catch (err) {
      console.error('[RoleChat] Stream error:', err);
      setError(err.message || 'Stream connection interrupted.');
      setMessages(prev => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          ...copy[copy.length - 1],
          content: `⚠️ **Connection Error**: ${err.message || 'Unable to connect to Groq AI streaming service. Please check connection and try again.'}`
        };
        return copy;
      });
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div className={`flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${embedded ? 'h-[750px] w-full' : 'h-[85vh] w-full max-w-6xl mx-auto'}`}>
      {/* Top Header Bar */}
      <header className="px-6 py-4 bg-slate-950/80 border-b border-slate-800/80 backdrop-blur-xl flex items-center justify-between z-10">
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-2xl border shadow-lg ${config.badgeBg}`}>
            <RoleIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-sm font-extrabold text-white tracking-wide">
                {config.title}
              </h2>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${config.badgeBg}`}>
                <Zap className="w-3 h-3 animate-pulse" />
                Groq AI Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">{config.subtitle}</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
              showHistory
                ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>History ({sessions.length})</span>
          </button>

          <button
            type="button"
            onClick={handleNewChat}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-blue-600/20 disabled:opacity-50 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* Main Body Layout with optional History Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Chat History Sidebar */}
        {showHistory && (
          <aside className="w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col p-3 overflow-y-auto z-10 transition-all">
            <div className="px-2 py-1 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
              Saved Conversations
            </div>
            {sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500">
                No past sessions yet.
              </div>
            ) : (
              <div className="space-y-1">
                {sessions.map(sess => (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess.id)}
                    className={`group flex items-center justify-between p-2.5 rounded-xl text-xs font-medium cursor-pointer transition ${
                      activeSessionId === sess.id
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <p className="truncate font-semibold">{sess.title || 'Untitled Chat'}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(sess.updated_at || sess.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Message Thread */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-900/60">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-6 max-w-xl mx-auto">
                <div className={`p-5 rounded-3xl border shadow-2xl ${config.badgeBg}`}>
                  <RoleIcon className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    Welcome, {user?.full_name || 'Scholar'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Your assistant is tuned for <strong className="text-slate-200">{config.title}</strong> guardrails, academic precision, and ultra-fast Groq streaming inference.
                  </p>
                </div>

                {/* Prompt Starter Chips */}
                <div className="w-full space-y-2 pt-2 text-left">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center">
                    Recommended Starters
                  </div>
                  {config.prompts.map((promptText, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessage(promptText)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/70 hover:border-blue-500/40 text-xs text-slate-300 hover:text-white transition flex items-center justify-between group shadow-sm"
                    >
                      <span className="truncate pr-3">{promptText}</span>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 shrink-0 transition" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex items-start gap-3.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div className={`p-2.5 rounded-2xl shrink-0 border ${
                      isUser
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20'
                        : 'bg-slate-800 text-cyan-400 border-slate-700 shadow-md'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    <div className={`max-w-3xl rounded-3xl p-5 text-sm shadow-xl transition ${
                      isUser
                        ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-800/90 border border-slate-700/80 text-slate-100 rounded-tl-none backdrop-blur-md'
                    }`}>
                      {msg.content ? (
                        <MarkdownRenderer content={msg.content} />
                      ) : (
                        <div className="flex items-center gap-2 text-cyan-400 py-1 font-medium text-xs">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Streaming Groq intelligence...</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 max-w-xl mx-auto">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-4 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md"
          >
            <div className="relative flex items-center max-w-4xl mx-auto">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                disabled={isStreaming}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder={`Ask ${config.title}... (Shift+Enter for new line)`}
                className="w-full pl-5 pr-14 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs resize-none shadow-inner leading-relaxed"
              />

              <button
                type="submit"
                disabled={!input.trim() || isStreaming}
                className="absolute right-2.5 p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 text-white shadow-md shadow-blue-600/20 transition cursor-pointer"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="text-center mt-2">
              <span className="text-[10px] text-slate-500 font-mono">
                Role Persona: <span className="text-slate-400 font-semibold">{rawRole}</span> • Groq AI Neural Engine
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
