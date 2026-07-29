import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Bot,
  FileSearch,
  FileText,
  UserCheck,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = () => {
  const { user } = useAuth();

  const navItems = [
    { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Student Directory', path: '/students', icon: Users },
    { label: 'Faculty & Workload', path: '/faculty', icon: GraduationCap },
    { label: 'Curriculum & Syllabi', path: '/curriculum', icon: BookOpen },
    { label: 'Attendance Logs', path: '/attendance', icon: CalendarCheck },
    { label: 'AI Academic Advisor', path: '/ai-advisor', icon: Bot, badge: 'Multi-Agent' },
    { label: 'Enterprise Policy RAG', path: '/policy-rag', icon: FileSearch, badge: 'AI Vector' },
    { label: 'Accreditation Reports', path: '/reports', icon: FileText },
    { label: 'Profile & Settings', path: '/profile', icon: UserCheck }
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800/80 flex flex-col h-screen sticky top-0 backdrop-blur-xl z-30">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-800/80 flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-extrabold text-base leading-tight text-white tracking-tight font-outfit">
            Academic AI
          </h1>
          <p className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">
            Enterprise Intelligence
          </p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          Core Modules
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User Footer Card */}
      {user && (
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user.full_name}
              className="w-9 h-9 rounded-full object-cover ring-2 ring-blue-500/30"
            />
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] font-semibold text-blue-400 truncate tracking-wide">{user.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
