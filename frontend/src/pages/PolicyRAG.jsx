import React, { useState } from 'react';
import api from '../services/api.js';
import {
  FileSearch,
  Search,
  BookOpen,
  Sparkles,
  Plus,
  Upload,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Modal } from '../components/common/Modal.jsx';

export const PolicyRAG = () => {
  const [query, setQuery] = useState('What happens if GPA falls below 2.0 or attendance drops below 75%?');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  // Upload Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'Academic Standards',
    content: ''
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const res = await api.post('/ai/policy-search', { query });
      setResults(res);
    } catch (e) {
      alert('Error searching policies');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadPolicy = async (e) => {
    e.preventDefault();
    try {
      await api.post('/ai/policy-upload', uploadForm);
      setIsModalOpen(false);
      alert('Policy document indexed successfully into RAG vector store!');
    } catch (e) {
      alert(e.message || 'Error uploading policy document');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <FileSearch className="w-6 h-6 text-blue-500" />
            Enterprise Policy RAG Engine
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Vector search over institutional handbooks, compliance codes, and grading regulations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4 text-blue-400" />
          Upload & Index Policy Document
        </button>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="glass-panel rounded-3xl p-4 border border-slate-800 flex gap-3 shadow-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything regarding university rules (e.g. course repeat limit, title IV aid)..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          {loading ? 'Querying Vector Index...' : 'RAG Policy Search'}
        </button>
      </form>

      {/* Search Results & AI Summary View */}
      {results && (
        <div className="space-y-6 animate-fadeIn">
          {/* AI Generated Synthesis */}
          <div className="glass-panel rounded-3xl p-6 border border-blue-500/30 bg-blue-950/20 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>Gemini RAG Evidence Synthesis</span>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
              {results.ai_summary}
            </div>
          </div>

          {/* Matched Vector Documents */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              Top Matched Handbook Sections ({results.results?.length || 0})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.results?.map((doc) => (
                <div key={doc.id} className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase">{doc.id}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white">{doc.title}</h4>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{doc.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Index Policy Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Policy Handbook to Vector Index">
        <form onSubmit={handleUploadPolicy} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Policy Document Title</label>
            <input
              type="text"
              required
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              placeholder="Section 5.1 - Academic Integrity & Plagiarism Standards"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category Scope</label>
            <select
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            >
              <option value="Academic Standards">Academic Standards</option>
              <option value="Curriculum & Grading">Curriculum & Grading</option>
              <option value="Faculty Governance">Faculty Governance</option>
              <option value="Compliance & Aid">Compliance & Aid</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Full Document Text Body</label>
            <textarea
              rows="5"
              required
              value={uploadForm.content}
              onChange={(e) => setUploadForm({ ...uploadForm, content: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white"
              placeholder="Paste exact policy text here for embedding computation..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500"
            >
              Compute Vector Embeddings & Index
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
