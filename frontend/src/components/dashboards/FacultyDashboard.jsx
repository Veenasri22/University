import React, { useEffect, useState } from 'react';
import api from '../../services/api.js';
import {
  GraduationCap,
  CalendarCheck,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  Save,
  Sparkles,
  Layers,
  Brain
} from 'lucide-react';

export const FacultyDashboard = () => {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState({});
  const [savedMsg, setSavedMsg] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [stuRes, crsRes] = await Promise.all([
          api.get('/students'),
          api.get('/courses')
        ]);
        setStudents(stuRes.students || []);
        setCourses(crsRes.courses || []);

        const initialAtt = {};
        (stuRes.students || []).forEach(s => {
          initialAtt[s.id] = 'PRESENT';
        });
        setAttendanceStatus(initialAtt);
      } catch (e) {
        console.warn('[FacultyDashboard] Fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleToggleAttendance = (studentId, status) => {
    setAttendanceStatus(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendanceMatrix = async () => {
    try {
      setSavedMsg(null);
      const promises = Object.entries(attendanceStatus).map(([sId, status]) => {
        const studentObj = students.find(s => s.id === sId);
        return api.post('/attendance', {
          course_code: 'CS201',
          student_id: sId,
          student_name: studentObj?.full_name || 'Student',
          status,
          department: studentObj?.department || 'Computer Science'
        });
      });
      await Promise.all(promises);
      setSavedMsg('Attendance matrix recorded and synced to Supabase successfully!');
      setTimeout(() => setSavedMsg(null), 4000);
    } catch (err) {
      alert('Error submitting attendance matrix');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white font-outfit tracking-tight flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-indigo-500" />
          Faculty Teaching & Evaluation Workstation
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          One-click class attendance entry matrix, syllabus unit progress sliders, and topic diagnostic tools.
        </p>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          {savedMsg}
        </div>
      )}

      {/* Grid: Attendance Matrix & Syllabus Sliders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Matrix */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-blue-400" />
              One-Click Class Attendance Matrix (CS201 Data Structures)
            </h3>
            <button
              onClick={handleSubmitAttendanceMatrix}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center gap-1.5 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Submit Matrix
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {students.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No students enrolled in class roster.</p>
            ) : (
              students.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                  <div>
                    <span className="font-bold text-white block">{s.full_name}</span>
                    <span className="text-[10px] text-slate-400">{s.student_id_number || s.student_code}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleAttendance(s.id, 'PRESENT')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        attendanceStatus[s.id] === 'PRESENT'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Present
                    </button>
                    <button
                      onClick={() => handleToggleAttendance(s.id, 'ABSENT')}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                        attendanceStatus[s.id] === 'ABSENT'
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Syllabus Progress Sliders */}
        <div className="glass-panel rounded-3xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-outfit flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            Curriculum Delivery & Syllabus Unit Sliders
          </h3>

          <div className="space-y-4">
            {courses.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No courses assigned to instructor.</p>
            ) : (
              courses.map(c => (
                <div key={c.id} className="space-y-2 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">{c.course_code} - {c.title}</span>
                    <span className="font-extrabold text-blue-400">{c.syllabus_progress}% Completed</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all" style={{ width: `${c.syllabus_progress}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
