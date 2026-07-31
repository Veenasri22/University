import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/common/Layout.jsx';

import { Login }        from './pages/Login.jsx';
import { Register }     from './pages/Register.jsx';
import { Dashboard }    from './pages/Dashboard.jsx';
import { Students }     from './pages/Students.jsx';
import { StudentDetail } from './pages/StudentDetail.jsx';
import { Faculty }      from './pages/Faculty.jsx';
import { Curriculum }   from './pages/Curriculum.jsx';
import { Attendance }   from './pages/Attendance.jsx';
import { AIAdvisor }    from './pages/AIAdvisor.jsx';
import { AiAdvisorPage } from './pages/AiAdvisorPage.jsx';
import { PolicyRAG }    from './pages/PolicyRAG.jsx';
import { Reports }      from './pages/Reports.jsx';
import { Profile }      from './pages/Profile.jsx';
import { InsightsPage } from './pages/InsightsPage.jsx';
import TrackerPage      from './pages/TrackerPage.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-glow-blue animate-pulse-slow">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </div>
        <p className="text-xs text-slate-400 font-semibold tracking-wide">
          Initializing Academic Intelligence…
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected — Core Dashboards */}
      <Route path="/dashboard"      element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/insights"       element={<ProtectedRoute><InsightsPage /></ProtectedRoute>} />
      <Route path="/tracker"        element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} />

      {/* Protected — Academic Management */}
      <Route path="/students"       element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/students/:id"   element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
      <Route path="/faculty"        element={<ProtectedRoute><Faculty /></ProtectedRoute>} />
      <Route path="/curriculum"     element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
      <Route path="/attendance"     element={<ProtectedRoute><Attendance /></ProtectedRoute>} />

      {/* Protected — AI Tools */}
      <Route path="/ai-advisor"      element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
      <Route path="/ai-advisor-chat" element={<ProtectedRoute><AiAdvisorPage /></ProtectedRoute>} />
      <Route path="/policy-rag"      element={<ProtectedRoute><PolicyRAG /></ProtectedRoute>} />

      {/* Protected — Reports & Profile */}
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
