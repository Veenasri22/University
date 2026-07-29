import React, { useEffect, useState } from 'react';
import api from '../services/api.js';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';

export const Curriculum = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleToggleOutcome = async (courseId, index) => {
    try {
      await api.patch(`/courses/${courseId}/progress`, { outcome_index: index });
      fetchCourses();
    } catch (e) {
      alert('Error updating outcome state');
    }
  };

  const handleUpdateProgress = async (courseId, newProgress) => {
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
      <div>
        <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-blue-500" />
          Curriculum Progression & Learning Outcomes
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Track syllabus milestone completion, prerequisite structures, and student outcome masteries.
        </p>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400 text-xs py-12">Loading curriculum mapping...</div>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-bold border border-blue-500/20">
                    {course.course_code} • {course.credits} Credits
                  </span>
                  <h3 className="text-base font-bold text-white mt-2">{course.title}</h3>
                  <p className="text-xs text-slate-400">{course.department} • Instructor: {course.faculty_name}</p>
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
                  <button
                    onClick={() => handleUpdateProgress(course.id, Math.min(100, course.syllabus_progress + 10))}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    +10% Progress Step
                  </button>
                </div>
              </div>

              {/* Learning Outcomes Interactive Checkboxes */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Accredited Learning Outcomes</h4>
                <div className="space-y-1.5">
                  {course.learning_outcomes?.map((lo, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleToggleOutcome(course.id, idx)}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
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
    </div>
  );
};
