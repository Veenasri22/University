import { supabase } from '../config/db.js';

export const getStudentTracker = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('*, profiles(full_name, email)')
      .or(`id.eq.${studentId},user_id.eq.${studentId},student_code.eq.${studentId}`)
      .maybeSingle();

    const studentData = student ? {
      ...student,
      full_name: student.profiles?.full_name || student.full_name || 'Student'
    } : null;

    const effectiveStudentId = studentData ? studentData.id : studentId;

    // Fetch attendance logs from Supabase
    const { data: att } = await supabase
      .from('attendance_logs')
      .select('*')
      .or(`student_id.eq.${effectiveStudentId},student_name.eq.${studentData?.full_name || ''}`)
      .order('date', { ascending: false });

    const attendanceRecords = att || [];

    const { data: coursesData } = await supabase
      .from('courses')
      .select('*');

    const syllabusRecords = (coursesData || []).map(c => ({
      id: c.id,
      course_id: c.id,
      course_code: c.course_code,
      course_name: c.title,
      completion_percentage: Number(c.syllabus_progress || 0),
      unit_title: 'Syllabus Core',
      topics_covered: Array.isArray(c.learning_outcomes) ? c.learning_outcomes.map(o => o.outcome).join(', ') : 'Core Topics',
      status: Number(c.syllabus_progress) === 100 ? 'Completed' : Number(c.syllabus_progress) > 0 ? 'In Progress' : 'Pending'
    }));

    const formattedAttendanceLogs = attendanceRecords.map(log => ({
      id: log.id,
      date: log.date,
      course_code: log.course_code || 'CS201',
      course_name: log.course_name || log.course_code || 'Course',
      status: log.status || 'Present',
      verification_status: log.verification_status || 'Verified'
    }));

    const presentCount = formattedAttendanceLogs.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
    const absentCount = formattedAttendanceLogs.filter(a => (a.status || '').toUpperCase() === 'ABSENT').length;
    const totalCount = formattedAttendanceLogs.length;

    const attendancePercentage = totalCount > 0
      ? Number(((presentCount / totalCount) * 100).toFixed(1))
      : Number(studentData?.attendance_rate || 100);

    const enrolledSyllabus = syllabusRecords.map(c => ({
      courseId: c.course_id || c.id,
      courseCode: c.course_code || 'CS201',
      courseName: c.course_name || c.title || 'Course',
      overallCompletionPercentage: Number(c.completion_percentage || 0),
      units: [
        {
          id: c.id,
          unit_title: c.unit_title || 'Core Syllabus',
          topics_covered: c.topics_covered || 'Course outline',
          completion_percentage: Number(c.completion_percentage || 0),
          status: c.status || 'Pending'
        }
      ]
    }));

    return res.json({
      success: true,
      student: studentData ? {
        id: studentData.id,
        fullName: studentData.full_name || studentData.email || 'Student',
        studentCode: studentData.student_code || 'STU-0001',
        department: studentData.department || 'Computer Science',
        currentGpa: studentData.current_gpa || 0.00,
        predictedRisk: studentData.predicted_risk || 'LOW'
      } : null,
      metrics: {
        attendancePercentage,
        presentCount,
        absentCount,
        totalClasses: totalCount
      },
      attendanceLogs: formattedAttendanceLogs,
      syllabusProgress: enrolledSyllabus
    });
  } catch (err) {
    next(err);
  }
};

export const getFacultyTracker = async (req, res, next) => {
  try {
    const { facultyId } = req.params;

    const { data: cData, error: cErr } = await supabase.from('courses').select('*');
    if (cErr) {
      console.error('[Tracker Controller] Supabase query error:', cErr.message);
      return res.status(500).json({ success: false, message: cErr.message });
    }

    const { data: aData } = await supabase.from('attendance_logs').select('*');

    const coursesList = cData || [];
    const attendanceList = aData || [];

    const totalPresent = attendanceList.filter(a => (a.status || '').toUpperCase() === 'PRESENT').length;
    const totalAbsent = attendanceList.filter(a => (a.status || '').toUpperCase() === 'ABSENT').length;
    const totalRecords = attendanceList.length;

    const classAttendanceAverage = totalRecords > 0
      ? Number(((totalPresent / totalRecords) * 100).toFixed(1))
      : 100;

    const syllabusWithCourse = coursesList.map(item => ({
      id: item.id,
      course_id: item.id,
      faculty_id: facultyId,
      course_code: item.course_code,
      course_name: item.title,
      unit_title: 'Syllabus & Learning Outcomes',
      topics_covered: Array.isArray(item.learning_outcomes) ? item.learning_outcomes.map(o => o.outcome).join(', ') : 'Topics',
      completion_percentage: Number(item.syllabus_progress || 0),
      status: Number(item.syllabus_progress) === 100 ? 'Completed' : Number(item.syllabus_progress) > 0 ? 'In Progress' : 'Pending',
      updated_at: item.updated_at || new Date().toISOString()
    }));

    return res.json({
      success: true,
      facultyId,
      classStats: {
        classAttendanceAverage,
        totalPresent,
        totalAbsent,
        totalClassesTracked: totalRecords
      },
      syllabusTracker: syllabusWithCourse
    });
  } catch (err) {
    next(err);
  }
};

export const updateSyllabusTopic = async (req, res, next) => {
  try {
    const { id, completion_percentage, status, topics_covered } = req.body;

    if (!id) {
      return res.status(400).json({ success: false, error: 'Course or Syllabus unit ID is required.' });
    }

    const completionPct = Number(completion_percentage);
    if (isNaN(completionPct) || completionPct < 0 || completionPct > 100) {
      return res.status(400).json({ success: false, error: 'completion_percentage must be an integer between 0 and 100.' });
    }

    const { data, error } = await supabase
      .from('courses')
      .update({
        syllabus_progress: completionPct,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[Tracker Controller] Supabase update syllabus error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    const updatedItem = data ? {
      id: data.id,
      course_code: data.course_code,
      course_name: data.title,
      completion_percentage: data.syllabus_progress,
      status: data.syllabus_progress === 100 ? 'Completed' : data.syllabus_progress > 0 ? 'In Progress' : 'Pending'
    } : {
      id,
      completion_percentage: completionPct,
      status: status || (completionPct === 100 ? 'Completed' : completionPct > 0 ? 'In Progress' : 'Pending')
    };

    return res.json({
      success: true,
      message: 'Syllabus unit updated successfully.',
      syllabus: updatedItem
    });
  } catch (err) {
    next(err);
  }
};
