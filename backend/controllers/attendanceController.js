import { supabase } from '../config/db.js';
import { dispatchGmailAlert } from '../services/mcpService.js';

export const getAttendanceLogs = async (req, res, next) => {
  try {
    const { department } = req.query;

    let query = supabase.from('attendance_logs').select('*').order('created_at', { ascending: false });

    if (department && department !== 'ALL') {
      query = query.eq('department', department);
    }

    const { data: logs, error } = await query;
    if (error) {
      console.error('[attendanceController] Supabase fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    // Fetch low attendance students for threshold alerts
    const { data: atRiskStudents } = await supabase
      .from('students')
      .select('*')
      .lt('attendance_rate', 75.0);

    const thresholdAlerts = (atRiskStudents || []).map(s => ({
      student_id: s.id,
      student_name: s.full_name || s.student_code,
      student_code: s.student_code,
      department: s.department,
      attendance_rate: s.attendance_rate,
      warning_level: s.attendance_rate < 65.0 ? 'CRITICAL' : 'WARNING',
      triggered_at: new Date().toISOString()
    }));

    res.json({
      success: true,
      logs: logs || [],
      thresholdAlerts
    });
  } catch (err) {
    next(err);
  }
};

export const logAttendance = async (req, res, next) => {
  try {
    const { course_code, student_id, student_name, status, department } = req.body;

    const newLogData = {
      id: `att-${Date.now()}`,
      course_code: course_code || 'CS201',
      student_id: student_id || null,
      student_name: student_name || 'Student',
      date: new Date().toISOString().split('T')[0],
      status: (status || 'PRESENT').toUpperCase(),
      department: department || 'Computer Science'
    };

    const { data: createdLog, error } = await supabase
      .from('attendance_logs')
      .insert(newLogData)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Insert attendance error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    // Update student's cumulative attendance rate in Supabase
    let updatedStudent = null;
    let mcpAlertSent = null;

    if (student_id || student_name) {
      const { data: student } = await supabase
        .from('students')
        .select('*')
        .or(`id.eq.${student_id || ''},student_code.eq.${student_id || ''},full_name.eq.${student_name || ''}`)
        .maybeSingle();

      if (student) {
        let currentRate = Number(student.attendance_rate || 100);
        if (newLogData.status === 'ABSENT') {
          currentRate = Math.max(50, Number((currentRate - 2.5).toFixed(1)));
        } else if (newLogData.status === 'PRESENT') {
          currentRate = Math.min(100, Number((currentRate + 0.5).toFixed(1)));
        }

        const updatePayload = {
          attendance_rate: currentRate,
          updated_at: new Date().toISOString()
        };

        if (currentRate < 75.0) {
          updatePayload.predicted_risk = 'HIGH';
        }

        const { data: updatedData } = await supabase
          .from('students')
          .update(updatePayload)
          .eq('id', student.id)
          .select()
          .single();

        if (updatedData) {
          updatedStudent = updatedData;
        }

        if (currentRate < 75.0) {
          mcpAlertSent = await dispatchGmailAlert({
            recipientEmail: student.email || `${student_name.toLowerCase().replace(/\s+/g, '.')}@student.university.edu`,
            subject: `[URGENT] Academic Attendance Threshold Warning (<75%)`,
            body: `Dear ${student_name}, Your cumulative attendance has fallen to ${currentRate}%. Under Policy 4.2, an immediate academic review is required.`,
            alertType: 'ATTENDANCE_WARNING'
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully and saved to Supabase',
      log: createdLog,
      updatedStudent,
      mcpAlertSent
    });
  } catch (err) {
    next(err);
  }
};
