import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Bot, User, Loader2, RefreshCw, AlertCircle, MessageSquare } from 'lucide-react';
import api from '../services/api';

/**
 * AiChatAssistant Component
 * Interactive Google Gemini AI Assistant chatbot component.
 * Zero dummy data - all sessions and messages come from live user input and Gemini AI responses.
 */
export const AiChatAssistant = () => {
  const [inputPrompt, setInputPrompt] = useState('');
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('gemini_ai_session_id') || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);

  // Auto-scroll chat window to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch session history if sessionId exists in state/localStorage
  useEffect(() => {
    if (sessionId) {
      fetchSessionMessages(sessionId);
    }
  }, [sessionId]);

  const fetchSessionMessages = async (id) => {
    try {
      const res = await api.get(`/ai/sessions/${id}/messages`);
      if (res && res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.warn('[AiChatAssistant] Could not load past session messages:', err);
    }
  };

  // Start a fresh conversation session
  const handleNewSession = () => {
    setSessionId(null);
    localStorage.removeItem('gemini_ai_session_id');
    setMessages([]);
    setError(null);
  };

  // Submit prompt to POST /api/ai/ask
  const handleSubmitPrompt = async (e) => {
    if (e) e.preventDefault();

    const promptText = inputPrompt.trim();
    if (!promptText || loading) return;

    // 1. Clear input box immediately as requested
    setInputPrompt('');
    setError(null);

    // 2. Optimistically append user message to UI thread (right side)
    const tempUserMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      message_text: promptText,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMessage]);
    setLoading(true);

    try {
      // 3. Send POST request to /api/ai/ask
      const response = await api.post('/ai/ask', {
        prompt: promptText,
        sessionId: sessionId
      });

      if (response && response.success) {
        // Maintain active sessionId in state & localStorage
        if (response.sessionId && response.sessionId !== sessionId) {
          setSessionId(response.sessionId);
          localStorage.setItem('gemini_ai_session_id', response.sessionId);
        }

        if (Array.isArray(response.messages)) {
          setMessages(response.messages);
        } else if (response.aiResponse) {
          const assistantMsg = {
            id: 'ai-' + Date.now(),
            sender: 'assistant',
            message_text: response.aiResponse,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, assistantMsg]);
        }
      } else {
        throw new Error(response?.error || response?.message || 'Failed to receive response from Gemini AI.');
      }
    } catch (err) {
      console.error('[AiChatAssistant Error]', err);
      setError(err.error || err.message || 'Error connecting to Gemini AI service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md transition-all duration-300 flex flex-col h-[600px]">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              Google Gemini AI Assistant
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                gemini-2.5-flash
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Ask any question in real time. Powered securely by Gemini AI on Node.js backend.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleNewSession}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Session</span>
        </button>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-200">How can Gemini AI assist you today?</h4>
              <p className="text-[11px] text-slate-400 max-w-sm mt-1">
                Type your question below to receive clear, accurate, and real-time answers from Google Gemini AI.
              </p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id || index}
                className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`p-2 rounded-xl shrink-0 ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-purple-400 border border-slate-700'}`}>
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-md shadow-indigo-600/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{msg.message_text}</div>
                  <div className={`text-[9px] mt-2 font-mono ${isUser ? 'text-indigo-200 text-right' : 'text-slate-500'}`}>
                    {new Date(msg.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Animated Typing / Loading Indicator */}
        {loading && (
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-slate-800 text-purple-400 border border-slate-700 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-indigo-300 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Gemini AI is processing your request...</span>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Form */}
      <form onSubmit={handleSubmitPrompt} className="mt-4 flex items-center gap-3">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Ask Google Gemini AI Assistant anything..."
          disabled={loading}
          className="flex-1 bg-slate-950/80 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all disabled:opacity-50"
        />

        <button
          type="submit"
          disabled={loading || !inputPrompt.trim()}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/25 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};

export default AiChatAssistant;
