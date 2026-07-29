import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { Layout } from './components/common/Layout.jsx';

import { Login } from './pages/Login.jsx';
import { Register } from './pages/Register.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Students } from './pages/Students.jsx';
import { StudentDetail } from './pages/StudentDetail.jsx';
import { Faculty } from './pages/Faculty.jsx';
import { Curriculum } from './pages/Curriculum.jsx';
import { Attendance } from './pages/Attendance.jsx';
import { AIAdvisor } from './pages/AIAdvisor.jsx';
import { AiAdvisorPage } from './pages/AiAdvisorPage.jsx';
import { PolicyRAG } from './pages/PolicyRAG.jsx';
import { Reports } from './pages/Reports.jsx';
import { Profile } from './pages/Profile.jsx';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-xs text-slate-400">
        Initializing Academic Intelligence Credentials...
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
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/students/:id" element={<ProtectedRoute><StudentDetail /></ProtectedRoute>} />
      <Route path="/faculty" element={<ProtectedRoute><Faculty /></ProtectedRoute>} />
      <Route path="/curriculum" element={<ProtectedRoute><Curriculum /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
      <Route path="/ai-advisor" element={<ProtectedRoute><AIAdvisor /></ProtectedRoute>} />
      <Route path="/ai-advisor-chat" element={<ProtectedRoute><AiAdvisorPage /></ProtectedRoute>} />
      <Route path="/policy-rag" element={<ProtectedRoute><PolicyRAG /></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

