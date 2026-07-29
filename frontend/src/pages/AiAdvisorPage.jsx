import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, User, Sparkles, PlusCircle, MessageSquare, Loader2, BookOpen, Clock, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export const AiAdvisorPage = () => {
  const { user } = useAuth();
  const userId = user?.id || 'prof-004';

  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [error, setError] = useState(null);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to bottom on new messages
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Fetch list of user's past chats on component mount
  useEffect(() => {
    fetchUserChats();
  }, [userId]);

  const fetchUserChats = async () => {
    try {
      const res = await api.get(`/advisor/chats/${userId}`);
      if (res && res.success && Array.isArray(res.chats)) {
        setChats(res.chats);
        if (res.chats.length > 0 && !activeChatId) {
          selectChatSession(res.chats[0].id);
        }
      }
    } catch (err) {
      console.warn('[Advisor UI] Failed to load chat sessions:', err);
    }
  };

  // Fetch message log for selected chat session
  const selectChatSession = async (chatId) => {
    setActiveChatId(chatId);
    setFetchingHistory(true);
    setError(null);
    try {
      const res = await api.get(`/advisor/messages/${chatId}`);
      if (res && res.success && Array.isArray(res.messages)) {
        setMessages(res.messages);
      } else {
        setMessages([]);
      }
    } catch (err) {
      console.error('[Advisor UI] Error loading chat messages:', err);
      setError('Could not load chat history.');
    } finally {
      setFetchingHistory(false);
    }
  };

  // Start new consultation session
  const startNewConsultation = () => {
    setActiveChatId(null);
    setMessages([]);
    setError(null);
  };

  // Send message to AI Advisor API endpoint POST /api/advisor/chat
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();

    const question = inputQuestion.trim();
    if (!question || loading) return;

    // Optimistically add user question to UI
    const tempUserMsg = {
      id: 'temp-' + Date.now(),
      sender: 'user',
      message_text: question,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, tempUserMsg]);
    setInputQuestion('');
    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/advisor/chat', {
        userId,
        chatId: activeChatId,
        userQuestion: question
      });

      if (response && response.success) {
        if (response.chatId && response.chatId !== activeChatId) {
          setActiveChatId(response.chatId);
          fetchUserChats(); // Refresh chat list sidebar
        }

        if (Array.isArray(response.messages)) {
          setMessages(response.messages);
        } else if (response.aiResponse) {
          const aiMsg = {
            id: 'ai-' + Date.now(),
            sender: 'assistant',
            message_text: response.aiResponse,
            created_at: new Date().toISOString()
          };
          setMessages(prev => [...prev, aiMsg]);
        }
      } else {
        throw new Error(response?.error || 'Failed to receive AI response.');
      }
    } catch (err) {
      console.error('[Advisor Chat Error]', err);
      setError(err.message || 'Error communicating with AI Academic Advisor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-indigo-500/20 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white font-outfit flex items-center gap-2">
                Interactive AI Academic Advisor
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  gemini-2.5-flash
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Empathetic academic guidance, degree audit planning, course selection, and study strategies.
              </p>
            </div>
          </div>

          <button
            onClick={startNewConsultation}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Consultation</span>
          </button>
        </div>
      </div>

      {/* Main Chat Interface Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[620px]">
        {/* Left Sidebar - Chat Sessions List */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-4 border border-slate-800 flex flex-col h-full overflow-hidden bg-slate-950/60">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 px-1">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              Chat History
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              {chats.length} Sessions
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 italic">
                No past consultations. Click "New Consultation" or ask a question to start.
              </div>
            ) : (
              chats.map(chat => {
                const isActive = chat.id === activeChatId;
                return (
                  <button
                    key={chat.id}
                    onClick={() => selectChatSession(chat.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-md shadow-indigo-600/10'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <span className="text-xs font-medium truncate">{chat.title || 'Academic Consultation'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 font-mono pl-5">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Panel - Conversation Area */}
        <div className="lg:col-span-3 glass-panel rounded-3xl border border-slate-800 flex flex-col h-full overflow-hidden bg-slate-950/80 shadow-2xl">
          {/* Top Status Header */}
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">AI Academic Advisor Assistant</h3>
                <p className="text-[11px] text-slate-400">Online & Ready to help with course strategy & academic advice</p>
              </div>
            </div>
            {activeChatId && (
              <span className="text-[10px] font-mono text-slate-500">
                Session: {activeChatId.substring(0, 8)}...
              </span>
            )}
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
            {fetchingHistory ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Fetching conversation context...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-4">
                <div className="p-4 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">How can I assist your academic journey today?</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Ask me anything about degree audit roadmaps, handling difficult coursework, study strategies, or university academic policies.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg text-left">
                  {[
                    "How can I improve my GPA in technical courses?",
                    "What strategies should I use for midterm exam preparation?",
                    "How do I request course repeat grade replacement?",
                    "Can you help me balance my weekly study schedule?"
                  ].map((suggested, idx) => (
                    <button
                      key={idx}
                      onClick={() => setInputQuestion(suggested)}
                      className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-indigo-500/50 hover:text-indigo-300 transition-all text-left"
                    >
                      💡 {suggested}
                    </button>
                  ))}
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
                    <div className={`p-2 rounded-xl shrink-0 ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 border border-slate-700'}`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                        isUser
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none shadow-lg shadow-indigo-600/20'
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

            {/* Live Typing Indicator */}
            {loading && (
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700 shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl rounded-tl-none text-xs text-indigo-300 flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>AI Academic Advisor is formulating guidance...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-3">
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask your AI Academic Advisor (e.g. 'How can I organize my study plan for finals?')..."
              disabled={loading}
              className="flex-1 bg-slate-900/90 border border-slate-700/80 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
            />

            <button
              type="submit"
              disabled={loading || !inputQuestion.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiAdvisorPage;
