import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Building2,
  Award,
  Bot,
  FileSearch,
  FileText,
  UserCheck,
  Sparkles,
  Brain,
  Activity,
  ChevronLeft,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

const ALL_ROLES = ['Admin', 'SUPER_ADMIN', 'DEAN', 'Department_Head', 'Faculty', 'FACULTY', 'ACADEMIC_ADVISOR', 'Student', 'STUDENT'];
const ADMIN_ROLES = ['Admin', 'SUPER_ADMIN', 'DEAN', 'Department_Head', 'ACADEMIC_ADVISOR'];
const FACULTY_UP = ['Admin', 'SUPER_ADMIN', 'DEAN', 'Department_Head', 'Faculty', 'FACULTY', 'ACADEMIC_ADVISOR'];

const NAV_SECTIONS = [
  {
    label: 'Core Intelligence',
    items: [
      { label: 'Executive Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ALL_ROLES },
      { label: 'AI Insights Hub',     path: '/insights',  icon: Brain,          roles: ALL_ROLES, badge: 'AI' },
      { label: 'Performance Tracker', path: '/tracker',   icon: Activity,       roles: ALL_ROLES, badge: 'New' },
    ]
  },
  {
    label: 'Academic Management',
    items: [
      { label: 'Departments',          path: '/departments',icon: Building2,     roles: ALL_ROLES },
      { label: 'Student Directory',    path: '/students',   icon: Users,         roles: FACULTY_UP },
      { label: 'Faculty Directory',    path: '/faculty',    icon: GraduationCap, roles: ALL_ROLES },
      { label: 'Subjects & Units',     path: '/subjects',   icon: BookOpen,      roles: ALL_ROLES },
      { label: 'Marks & Backlogs',     path: '/marks',      icon: Award,         roles: ALL_ROLES },
      { label: 'Curriculum & Syllabi', path: '/curriculum', icon: BookOpen,     roles: ALL_ROLES },
      { label: 'Attendance Logs',      path: '/attendance', icon: CalendarCheck, roles: ALL_ROLES },
    ]
  },
  {
    label: 'AI Engine',
    items: [
      { label: 'AI Academic Advisor', path: '/ai-advisor',      icon: Bot,        roles: ALL_ROLES, badge: 'Multi-Agent' },
      { label: 'AI Advisor Chat',     path: '/ai-advisor-chat', icon: Sparkles,   roles: ALL_ROLES, badge: 'Live Chat' },
      { label: 'Policy RAG',          path: '/policy-rag',      icon: FileSearch, roles: ADMIN_ROLES, badge: 'AI Vector' },
    ]
  },
  {
    label: 'Reports & Admin',
    items: [
      { label: 'Accreditation Reports', path: '/reports', icon: FileText,  roles: ADMIN_ROLES },
      { label: 'Profile & Settings',    path: '/profile', icon: UserCheck, roles: ALL_ROLES },
    ]
  }
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const userRole = user?.role || '';
  const isAllowed = (roles) => roles.includes(userRole) || roles.includes('ALL');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={`${collapsed ? 'w-[72px]' : 'w-64'} bg-white dark:bg-slate-900/95 border-r border-slate-200 dark:border-slate-800/70 flex flex-col h-screen sticky top-0 backdrop-blur-xl z-30 transition-all duration-300 ease-in-out overflow-hidden shadow-sm`}
    >
      {/* Brand Header */}
      <div className={`flex items-center gap-3 border-b border-slate-200 dark:border-slate-800/70 flex-shrink-0 ${collapsed ? 'px-4 py-5 justify-center' : 'px-5 py-4'}`}>
        <div className="relative flex-shrink-0">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/25">
            <Sparkles className="w-4.5 h-4.5 w-[18px] h-[18px]" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900 shadow-[0_0_6px_2px_rgba(52,211,153,0.5)]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-extrabold text-[13px] leading-tight text-slate-900 dark:text-white tracking-tight font-outfit truncate">
              Academic AI
            </h1>
            <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase">
              Intelligence Platform
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-5 overflow-y-auto min-h-0">
        {NAV_SECTIONS.map((section) => {
          const visibleItems = section.items.filter(item => isAllowed(item.roles));
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.label}>
              {!collapsed && (
                <div className="px-3 pb-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-[0.15em]">
                  {section.label}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      title={collapsed ? item.label : undefined}
                      className={({ isActive }) =>
                        `flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3'} py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 group relative ${
                          isActive
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 sidebar-active-glow'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                        }`
                      }
                    >
                      <div className={`flex items-center ${collapsed ? '' : 'gap-2.5'}`}>
                        <Icon className="w-4 h-4 shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </div>
                      {!collapsed && item.badge && (
                        <span className="px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/25 flex-shrink-0">
                          {item.badge}
                        </span>
                      )}
                      {/* Tooltip for collapsed mode */}
                      {collapsed && (
                        <div className="absolute left-full ml-2.5 px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[11px] font-semibold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 shadow-xl z-50">
                          {item.label}
                          {item.badge && <span className="ml-1.5 text-blue-400">[{item.badge}]</span>}
                        </div>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="border-t border-slate-800/70 flex-shrink-0 p-3 space-y-2">
        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(v => !v)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition-all text-xs font-semibold"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <><ChevronLeft className="w-4 h-4" /><span>Collapse</span></>}
        </button>

        {user && !collapsed && (
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/60">
            <img
              src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=1e3a5f&color=60a5fa&size=80`}
              alt={user.full_name}
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-blue-500/30 flex-shrink-0"
            />
            <div className="overflow-hidden flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.full_name}</p>
              <p className="text-[10px] font-semibold text-blue-400 truncate tracking-wide">{user.role}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {user && collapsed && (
          <button
            onClick={handleLogout}
            title="Logout"
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
};
