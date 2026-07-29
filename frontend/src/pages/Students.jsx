import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { RiskBadge } from '../components/common/RiskBadge.jsx';
import { Modal } from '../components/common/Modal.jsx';
import {
  Users,
  Search,
  Filter,
  Plus,
  Sparkles,
  ChevronRight,
  UserCheck,
  TrendingDown,
  Brain
} from 'lucide-react';

export const Students = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('ALL');
  const [riskLevel, setRiskLevel] = useState('ALL');

  // Modal State for New Student
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_code: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
    full_name: '',
    email: '',
    department: 'Computer Science',
    enrollment_year: 2024,
    current_gpa: 3.20,
    attendance_rate: 90.0,
    credits_earned: 30
  });

  const navigate = useNavigate();

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/students', {
        params: { search, department, riskLevel }
      });
      setStudents(res.students || []);
    } catch (e) {
      console.warn('[Students] Error fetching directory:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [department, riskLevel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', newStudent);
      setIsModalOpen(false);
      fetchStudents();
    } catch (err) {
      alert(err.message || 'Error creating student record');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Student Intelligence Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Search, evaluate risk trajectories, and log academic performance updates.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          Enroll New Student
        </button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 justify-between border border-slate-800">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, code, email..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Admin</option>
              <option value="Mechanical Engineering">Mechanical Eng</option>
              <option value="Life Sciences">Life Sciences</option>
              <option value="Humanities">Humanities</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <select
            value={riskLevel}
            onChange={(e) => setRiskLevel(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Moderate Risk</option>
            <option value="HIGH">High Risk (Critical)</option>
          </select>
        </div>
      </div>

      {/* Student Table */}
      <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 uppercase tracking-wider text-[10px] font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Code / Dept</th>
                <th className="px-6 py-4">Current GPA</th>
                <th className="px-6 py-4">Attendance</th>
                <th className="px-6 py-4">Predicted Risk</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    Loading student data...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                    No students match the current filters.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-blue-400 text-xs">
                          {student.full_name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{student.full_name}</div>
                          <div className="text-[11px] text-slate-400">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{student.student_code}</div>
                      <div className="text-[11px] text-slate-400">{student.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-extrabold text-xs ${
                        student.current_gpa >= 3.5 ? 'text-emerald-400' : student.current_gpa < 2.5 ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {Number(student.current_gpa).toFixed(2)} / 4.00
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${student.attendance_rate >= 80 ? 'bg-emerald-500' : student.attendance_rate < 70 ? 'bg-rose-500' : 'bg-amber-500'}`}
                            style={{ width: `${student.attendance_rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-xs">{student.attendance_rate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RiskBadge riskLevel={student.predicted_risk} />
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {student.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <span>Profile & AI Risk</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enroll Student Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enroll New Student Record">
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Student Code</label>
              <input
                type="text"
                required
                value={newStudent.student_code}
                onChange={(e) => setNewStudent({ ...newStudent, student_code: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newStudent.full_name}
                onChange={(e) => setNewStudent({ ...newStudent, full_name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="Jordan Vance"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                placeholder="jordan.vance@student.university.edu"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={newStudent.department}
                onChange={(e) => setNewStudent({ ...newStudent, department: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="Computer Science">Computer Science</option>
                <option value="Business Administration">Business Admin</option>
                <option value="Mechanical Engineering">Mechanical Eng</option>
                <option value="Life Sciences">Life Sciences</option>
                <option value="Humanities">Humanities</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Current GPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={newStudent.current_gpa}
                onChange={(e) => setNewStudent({ ...newStudent, current_gpa: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Attendance %</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={newStudent.attendance_rate}
                onChange={(e) => setNewStudent({ ...newStudent, attendance_rate: parseFloat(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Enrollment Year</label>
              <input
                type="number"
                value={newStudent.enrollment_year}
                onChange={(e) => setNewStudent({ ...newStudent, enrollment_year: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-md shadow-blue-600/30"
            >
              Confirm Enrollment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
