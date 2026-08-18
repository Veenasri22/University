import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import { Modal } from '../components/common/Modal.jsx';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Plus,
  Award,
  ChevronRight
} from 'lucide-react';

import { useAuth } from '../context/AuthContext.jsx';

export const Curriculum = () => {
  const { user } = useAuth();
  const role = (user?.role || '').toUpperCase();
  const isDean = role === 'DEAN' || role === 'SUPER_ADMIN';
  const canEditProgress = isDean || role === 'FACULTY';

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State for New Course
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    course_code: '',
    title: '',
    department: 'Computer Science',
    credits: 3,
    prerequisites: '',
    learning_outcomes: 'Master core principles, Complete practical project'
  });

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/courses');
      setCourses(res.courses || []);
    } catch (e) {
      console.warn('[Curriculum] Error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses', newCourse);
      setIsModalOpen(false);
      setNewCourse({
        course_code: '',
        title: '',
        department: 'Computer Science',
        credits: 3,
        prerequisites: '',
        learning_outcomes: 'Master core principles, Complete practical project'
      });
      fetchCourses();
    } catch (err) {
      alert(err.message || 'Error creating course');
    }
  };

  const handleToggleOutcome = async (courseId, index) => {
    if (!canEditProgress) return;
    try {
      await api.patch(`/courses/${courseId}/progress`, { outcome_index: index });
      fetchCourses();
    } catch (e) {
      alert('Error updating outcome state');
    }
  };

  const handleUpdateProgress = async (courseId, newProgress) => {
    if (!canEditProgress) return;
    try {
      await api.patch(`/courses/${courseId}/progress`, { syllabus_progress: newProgress });
      fetchCourses();
    } catch (e) {
      alert('Error updating syllabus progress');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            Curriculum Progression & Learning Outcomes
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Track syllabus milestone completion, prerequisite structures, and student outcome masteries.
          </p>
        </div>

        {isDean && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Course
          </button>
        )}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12">Loading curriculum mapping...</div>
        ) : courses.length === 0 ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12 bg-slate-900/40 rounded-3xl border border-slate-800 p-8">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="font-bold text-white mb-1">No curriculum courses added yet</p>
            <p className="text-slate-400">{isDean ? 'Click "Add New Course" above to create your course offering in Supabase.' : 'No courses have been added to the institution curriculum yet.'}</p>
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                    {course.course_code} • {course.credits} Credits
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.department} {course.faculty_name ? `• Instructor: ${course.faculty_name}` : ''}</p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-extrabold text-white">{course.syllabus_progress}%</div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Syllabus Progress</div>
                </div>
              </div>

              {/* Progress Slider / Bar */}
              <div className="space-y-1">
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-300"
                    style={{ width: `${course.syllabus_progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>Prerequisites: {course.prerequisites?.join(', ') || 'None'}</span>
                  {canEditProgress && (
                    <button
                      onClick={() => handleUpdateProgress(course.id, Math.min(100, course.syllabus_progress + 10))}
                      className="text-blue-400 font-bold hover:underline"
                    >
                      +10% Progress Step
                    </button>
                  )}
                </div>
              </div>

              {/* Learning Outcomes Interactive Checkboxes */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Accredited Learning Outcomes</h4>
                <div className="space-y-1.5">
                  {course.learning_outcomes?.map((lo, idx) => (
                    <div
                      key={idx}
                      onClick={() => canEditProgress && handleToggleOutcome(course.id, idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                        canEditProgress ? 'cursor-pointer' : 'cursor-default'
                      } ${
                        lo.completed
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <CheckCircle className={`w-4 h-4 ${lo.completed ? 'text-emerald-400' : 'text-slate-600'}`} />
                        {lo.outcome}
                      </span>
                      <span className="text-[10px] font-bold uppercase">{lo.completed ? 'Achieved' : 'In Progress'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal for Adding New Course */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add New Curriculum Course">
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Course Code</label>
              <input
                type="text"
                required
                placeholder="CS201"
                value={newCourse.course_code}
                onChange={e => setNewCourse({ ...newCourse, course_code: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Credits</label>
              <input
                type="number"
                required
                min="1"
                max="10"
                value={newCourse.credits}
                onChange={e => setNewCourse({ ...newCourse, credits: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Course Title</label>
            <input
              type="text"
              required
              placeholder="Data Structures & Algorithms"
              value={newCourse.title}
              onChange={e => setNewCourse({ ...newCourse, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Department</label>
            <select
              value={newCourse.department}
              onChange={e => setNewCourse({ ...newCourse, department: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Computer Science">Computer Science</option>
              <option value="Business Administration">Business Admin</option>
              <option value="Mechanical Engineering">Mechanical Eng</option>
              <option value="Life Sciences">Life Sciences</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Prerequisites (Comma separated)</label>
            <input
              type="text"
              placeholder="CS101, MATH101"
              value={newCourse.prerequisites}
              onChange={e => setNewCourse({ ...newCourse, prerequisites: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1">Learning Outcomes (Comma separated)</label>
            <input
              type="text"
              placeholder="Implement binary search trees, Analyze asymptotic complexity"
              value={newCourse.learning_outcomes}
              onChange={e => setNewCourse({ ...newCourse, learning_outcomes: e.target.value })}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30"
            >
              Save Course to Supabase
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
