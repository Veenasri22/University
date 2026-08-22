import React, { useState } from 'react';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { Bot, X, Sparkles } from 'lucide-react';
import RoleChatDrawer from '../RoleChatDrawer.jsx';

export const Layout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Floating AI Chat Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setDrawerOpen(v => !v)}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs shadow-2xl shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
        >
          <div className="relative">
            <Sparkles className="w-4.5 h-4.5 w-[18px] h-[18px] animate-pulse text-cyan-300" />
          </div>
          <span>AI Academic Assistant</span>
          <span className="px-1.5 py-0.5 rounded-md bg-white/20 text-[9px] font-mono tracking-wider uppercase">
            Groq Llama
          </span>
        </button>
      </div>

      {/* Global Floating AI Chat Drawer Modal */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col animate-scale-up">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="absolute -top-3 -right-3 z-50 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border border-slate-700 shadow-xl transition"
              title="Close AI Assistant"
            >
              <X className="w-4 h-4" />
            </button>
            <RoleChatDrawer embedded={true} />
          </div>
        </div>
      )}
    </div>
  );
};
