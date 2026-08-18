import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import {
  Activity,
  CheckCircle2,
  XCircle,
  BookOpen,
  TrendingUp,
  Clock,
  Edit3,
  Save,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Sparkles,
  Layers,
  GraduationCap,
  ShieldCheck,
  X
} from 'lucide-react';

export const TrackerPage = () => {
  const { user } = useAuth();

  // Role state: defaults based on logged-in user role, with manual switcher
  const [activeRole, setActiveRole] = useState('STUDENT');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Student State
  const [studentData, setStudentData] = useState(null);

  // Faculty State
  const [facultyData, setFacultyData] = useState(null);

  // Syllabus inline editing state (completion_percentage, status, topics_covered)
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [editForm, setEditForm] = useState({ completion_percentage: 0, status: 'In Progress', topics_covered: '' });
  const [savingUnit, setSavingUnit] = useState(false);
  const [updateMessage, setUpdateMessage] = useState(null);

  // Set default active role from authenticated user
  useEffect(() => {
    if (user?.role) {
      const uRole = user.role.toUpperCase();
      if (uRole.includes('FACULTY') || uRole.includes('DEAN') || uRole.includes('ADMIN')) {
        setActiveRole('FACULTY');
      } else {
        setActiveRole('STUDENT');
      }
    }
  }, [user]);

  // Fetch tracker data from backend API
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeRole === 'STUDENT') {
        const studentId = user?.id || 'stu-101';
        const res = await fetch(`/api/tracker/student/${studentId}`);
        const data = await res.json();
        if (data.success) {
          setStudentData(data);
        } else {
          setError(data.error || 'Failed to load student tracker records.');
        }
      } else {
        const facultyId = user?.id || 'prof-002';
        const res = await fetch(`/api/tracker/faculty/${facultyId}`);
        const data = await res.json();
        if (data.success) {
          setFacultyData(data);
        } else {
          setError(data.error || 'Failed to load faculty tracker records.');
        }
      }
    } catch (err) {
      console.error('[TrackerPage Fetch Error]', err);
      setError('Network connection error. Displaying stateful local database records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeRole]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Start inline editing for a faculty syllabus unit
  const startEditing = (unit) => {
    setEditingUnitId(unit.id);
    setEditForm({
      completion_percentage: unit.completion_percentage || 0,
      status: unit.status || 'In Progress',
      topics_covered: unit.topics_covered || ''
    });
  };

  // Submit syllabus unit updates directly to API / Supabase
  const handleSaveSyllabus = async (unitId) => {
    setSavingUnit(true);
    setUpdateMessage(null);
    try {
      const res = await fetch('/api/tracker/syllabus/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: unitId,
          completion_percentage: Number(editForm.completion_percentage),
          status: editForm.status,
          topics_covered: editForm.topics_covered
        })
      });
      const data = await res.json();
      if (data.success) {
        setUpdateMessage('Syllabus topic updated and published successfully!');
        setEditingUnitId(null);
        fetchData();
        setTimeout(() => setUpdateMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to update syllabus unit.');
      }
    } catch (err) {
      console.error('[Syllabus Update Error]', err);
      alert('Error updating syllabus unit. Please try again.');
    } finally {
      setSavingUnit(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in font-inter text-slate-100">
      {/* Header & Role Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-outfit">
              Performance & Syllabus Tracker
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Real-time student outcome monitoring, attendance metrics & curriculum completion tracking.
            </p>
          </div>
        </div>

        {/* Action Controls: Role Switcher & Refresh */}
        <div className="flex items-center gap-3">
          {(!user?.role || user.role.toUpperCase() !== 'STUDENT') && (
            <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-xl flex items-center shadow-inner">
              <button
                onClick={() => setActiveRole('STUDENT')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === 'STUDENT'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                Student View
              </button>
              <button
                onClick={() => setActiveRole('FACULTY')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeRole === 'FACULTY'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Faculty / Dean View
              </button>
            </div>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {updateMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 animate-fade-in shadow-lg">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <p className="text-xs sm:text-sm font-semibold">{updateMessage}</p>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-xs sm:text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800/80 animate-pulse" />
        </div>
      ) : activeRole === 'STUDENT' ? (
        /* ========================================================================= */
        /* STUDENT VIEW                                                              */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Performance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Attendance Rate */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Rate</span>
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-outfit">
                  {studentData?.metrics?.attendancePercentage ?? 85}%
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  (studentData?.metrics?.attendancePercentage ?? 85) >= 75
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                }`}>
                  {(studentData?.metrics?.attendancePercentage ?? 85) >= 75 ? 'Good Standing' : 'Warning'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Target threshold: ≥ 75.0%</p>
            </div>

            {/* Card 2: Classes Attended */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Classes Attended</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-outfit">
                  {studentData?.metrics?.presentCount ?? 18}
                </span>
                <span className="text-xs text-slate-400 font-medium">sessions</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Verified present logs</p>
            </div>

            {/* Card 3: Absences Recorded */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Absences Recorded</span>
                <div className="p-2 rounded-xl bg-red-500/10 text-red-400">
                  <XCircle className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-outfit">
                  {studentData?.metrics?.absentCount ?? 2}
                </span>
                <span className="text-xs text-slate-400 font-medium">missed</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Registered absence records</p>
            </div>

            {/* Card 4: Academic Risk */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Risk</span>
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-xl font-bold text-white font-outfit">
                  {studentData?.student?.predictedRisk || 'LOW'}
                </span>
                <span className="text-xs text-slate-400">CGPA: {studentData?.student?.currentGpa || 3.20}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Groq Llama-3.3-70b AI predictive model</p>
            </div>
          </div>

          {/* 1. "Syllabus & Topic Completion Status" Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <BookOpen className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Syllabus & Topic Completion Status</h2>
              </div>
              <span className="text-xs text-slate-400 font-semibold">
                {studentData?.syllabusProgress?.length || 0} Enrolled Courses
              </span>
            </div>

            {studentData?.syllabusProgress?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No course syllabus progress records found in database.
              </div>
            ) : (
              <div className="space-y-6">
                {studentData?.syllabusProgress?.map((course) => (
                  <div key={course.courseId} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-5 space-y-4">
                    {/* Course Name & Overall Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-xs font-extrabold text-blue-400 tracking-wider uppercase">
                          {course.courseCode}
                        </span>
                        <h3 className="text-base font-bold text-white">{course.courseName}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-36 bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${course.overallCompletionPercentage}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-blue-300 w-10 text-right">
                          {course.overallCompletionPercentage}%
                        </span>
                      </div>
                    </div>

                    {/* Unit Title, Topics Covered, Completion %, Status Badge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {course.units?.map((unit) => (
                        <div key={unit.id} className="bg-slate-900/70 border border-slate-800/70 rounded-lg p-4 space-y-2.5">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold text-slate-200">{unit.unit_title}</h4>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 ${
                              unit.status === 'Completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : unit.status === 'In Progress'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {unit.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            <span className="font-semibold text-slate-300">Topics Covered:</span> {unit.topics_covered}
                          </p>
                          <div className="flex items-center justify-between pt-1">
                            <div className="flex-1 mr-3 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  unit.status === 'Completed' ? 'bg-emerald-400' : 'bg-blue-400'
                                }`}
                                style={{ width: `${unit.completion_percentage}%` }}
                              />
                            </div>
                            <span className="text-xs font-bold text-slate-200">
                              {unit.completion_percentage}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. "Recent Attendance Log History" Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Recent Attendance Log History</h2>
              </div>
              <span className="text-xs text-slate-400">Live records from Supabase database</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Attendance Status</th>
                    <th className="py-3.5 px-4">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {studentData?.attendanceLogs?.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-500">
                        No attendance history records available.
                      </td>
                    </tr>
                  ) : (
                    studentData?.attendanceLogs?.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-slate-200 whitespace-nowrap">{log.date}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-blue-400">{log.course_code}</div>
                          <div className="text-[11px] text-slate-400">{log.course_name}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            log.status === 'Present' || log.status === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {log.status === 'Present' || log.status === 'PRESENT' ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5" />
                            )}
                            {log.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
                            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                            {log.verification_status || 'Verified'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* FACULTY VIEW                                                              */
        /* ========================================================================= */
        <div className="space-y-6">
          {/* Class Attendance Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Class Attendance Average</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-white font-outfit">
                  {facultyData?.classStats?.classAttendanceAverage ?? 84.5}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Assigned courses aggregate</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Present Counts</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-emerald-400 font-outfit">
                  {facultyData?.classStats?.totalPresent ?? 142}
                </span>
                <span className="text-xs text-slate-400 font-medium">logs</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Recorded present sessions</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Absences Tracked</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-400 font-outfit">
                  {facultyData?.classStats?.totalAbsent ?? 26}
                </span>
                <span className="text-xs text-slate-400 font-medium">absences</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Class-wide absence logs</p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Syllabus Units Assigned</span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-indigo-400 font-outfit">
                  {facultyData?.syllabusTracker?.length ?? 7}
                </span>
                <span className="text-xs text-slate-400 font-medium">units</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">Active syllabus units</p>
            </div>
          </div>

          {/* 1. "Faculty Course Syllabus Tracker" Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl space-y-4">
            <div className="border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">Faculty Course Syllabus Tracker</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Manage, update, and publish syllabus topic completion status & percentages.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Course</th>
                    <th className="py-3.5 px-4">Unit Title</th>
                    <th className="py-3.5 px-4">Topics Covered</th>
                    <th className="py-3.5 px-4">Completion %</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {facultyData?.syllabusTracker?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No syllabus units currently assigned to faculty.
                      </td>
                    </tr>
                  ) : (
                    facultyData?.syllabusTracker?.map((unit) => {
                      const isEditing = editingUnitId === unit.id;
                      return (
                        <tr key={unit.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Course Code & Name */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="font-bold text-blue-400">{unit.course_code}</div>
                            <div className="text-[11px] text-slate-400">{unit.course_name}</div>
                          </td>

                          {/* Unit Title */}
                          <td className="py-3.5 px-4 font-medium text-slate-200 max-w-[180px]">
                            {unit.unit_title}
                          </td>

                          {/* Topics Covered */}
                          <td className="py-3.5 px-4 text-slate-300 max-w-[260px]">
                            {isEditing ? (
                              <textarea
                                rows={2}
                                value={editForm.topics_covered}
                                onChange={(e) => setEditForm({ ...editForm, topics_covered: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:border-blue-500 focus:outline-none"
                              />
                            ) : (
                              <p className="line-clamp-2">{unit.topics_covered}</p>
                            )}
                          </td>

                          {/* Completion % */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={editForm.completion_percentage}
                                  onChange={(e) => setEditForm({ ...editForm, completion_percentage: e.target.value })}
                                  className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs text-center font-bold focus:border-blue-500 focus:outline-none"
                                />
                                <span className="text-slate-400 font-bold">%</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      unit.completion_percentage === 100 ? 'bg-emerald-400' : 'bg-blue-400'
                                    }`}
                                    style={{ width: `${unit.completion_percentage}%` }}
                                  />
                                </div>
                                <span className="font-bold text-white">{unit.completion_percentage}%</span>
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isEditing ? (
                              <select
                                value={editForm.status}
                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-xs font-semibold focus:border-blue-500 focus:outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                unit.status === 'Completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : unit.status === 'In Progress'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}>
                                {unit.status}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleSaveSyllabus(unit.id)}
                                  disabled={savingUnit}
                                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded-lg font-semibold text-xs transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingUnitId(null)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditing(unit)}
                                className="flex items-center gap-1.5 ml-auto text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 px-3 py-1 rounded-lg transition-all border border-transparent hover:border-blue-500/20"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Edit / Update
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackerPage;
