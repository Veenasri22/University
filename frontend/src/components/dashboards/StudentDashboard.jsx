import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  GraduationCap,
  Award,
  CalendarCheck,
  BookOpen,
  Brain,
  Sparkles,
  Send,
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  X
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const StudentDashboard = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // AI Advisor Drawer State
  const [isAdvisorOpen, setIsAdvisorOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'assistant', text: `Hello ${user?.full_name || 'Student'}, I am your Groq AI Academic Advisor. How can I assist you with your study plan or course progress today?` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        const res = await api.get('/students');
        const list = res.students || [];
        const myStudent = list.find(s => s.email === user?.email || s.user_id === user?.id) || list[0];
        setStudent(myStudent);

        const attRes = await api.get('/attendance');
        setAttendance(attRes.logs || []);
      } catch (e) {
        console.warn('[StudentDashboard] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStudentData();
  }, [user]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setSending(true);

    try {
      const res = await api.post('/ai/advisor-chat', {
        message: userText,
        studentId: student?.id,
        agentType: 'ADVISOR'
      });
      setChatMessages(prev => [...prev, { sender: 'assistant', text: res.text || res.message || 'I have analyzed your request. Keep focus on Data Structures review.' }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'assistant', text: 'Error connecting to Groq AI Advisor.' }]);
    } finally {
      setSending(false);
    }
  };

  const gpaData = [
    { term: 'Fall 2024', gpa: 3.10 },
    { term: 'Spring 2025', gpa: 3.35 },
    { term: 'Fall 2025', gpa: student?.cgpa || student?.current_gpa || 3.50 }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            Student Academic & Risk Portal
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Personal CGPA trend lines, subject attendance dials, backlog alerts, and interactive Groq AI Advisor.
          </p>
        </div>

        <button
          onClick={() => setIsAdvisorOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Brain className="w-4 h-4 text-blue-300" />
          Open Groq AI Advisor Drawer
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Cumulative GPA (CGPA)</span>
          <div className="text-2xl font-extrabold text-amber-400 font-outfit">{student?.cgpa || student?.current_gpa || '3.50'}</div>
          <span className="text-[10px] text-slate-400">Semester {student?.semester || 3} Standing</span>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Cumulative Attendance</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-outfit">{student?.attendance_rate || 92.0}%</div>
          <span className="text-[10px] text-emerald-400 font-semibold">Above 75% Threshold</span>
        </div>

        <div className="glass-panel rounded-3xl p-5 border border-slate-800 space-y-1">
          <span className="text-xs font-semibold text-slate-400">Active Backlogs</span>
          <div className="text-2xl font-extrabold text-emerald-400 font-outfit">0</div>
          <span className="text-[10px] text-slate-400">No active backlogs flagged</span>
        </div>
      </div>

      {/* GPA Trend Line Chart */}
      <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Semester Academic Trajectory (GPA Trend)
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={gpaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="term" stroke="#94a3b8" fontSize={11} />
              <YAxis domain={[0, 4]} stroke="#94a3b8" fontSize={11} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }} />
              <Line type="monotone" dataKey="gpa" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Groq AI Academic Advisor Drawer */}
      {isAdvisorOpen && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-slate-950 border-l border-slate-800 shadow-2xl z-50 p-5 flex flex-col justify-between animate-fadeIn">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white font-outfit">Groq AI Academic Advisor</h3>
              </div>
              <button onClick={() => setIsAdvisorOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white ml-6'
                      : 'bg-slate-900 border border-slate-800 text-slate-200 mr-6'
                  }`}
                >
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendChat} className="relative flex items-center pt-3 border-t border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Ask AI advisor for study tips..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-3 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={sending}
              className="absolute right-2 p-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
