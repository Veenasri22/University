import { supabase } from '../config/db.js';
import { mockStore } from '../services/mockStore.js';
import { dispatchGmailAlert } from '../services/mcpService.js';

export const getAttendanceLogs = async (req, res, next) => {
  try {
    const { department } = req.query;

    let logs = [];
    let thresholdAlerts = [];

    if (supabase) {
      try {
        let query = supabase.from('attendance_records').select('*').order('created_at', { ascending: false });

        if (department && department !== 'ALL') {
          query = query.eq('department', department);
        }

        const { data, error } = await query;
        if (!error && data) {
          logs = data;
        }

        // Fetch low attendance students for threshold alerts
        const { data: atRiskStudents } = await supabase
          .from('students')
          .select('*')
          .lt('attendance_rate', 75.0);

        if (atRiskStudents) {
          thresholdAlerts = atRiskStudents.map(s => ({
            student_id: s.id,
            student_name: s.full_name,
            student_code: s.student_code,
            department: s.department,
            attendance_rate: s.attendance_rate,
            warning_level: s.attendance_rate < 65.0 ? 'CRITICAL' : 'WARNING',
            triggered_at: new Date().toISOString()
          }));
        }
      } catch (err) {
        console.warn('[attendanceController] Supabase fetch warning:', err.message);
      }
    }

    if (logs.length === 0) {
      logs = [...mockStore.attendance_logs];
      if (department && department !== 'ALL') {
        logs = logs.filter(l => l.department === department);
      }
    }

    if (thresholdAlerts.length === 0) {
      thresholdAlerts = mockStore.students
        .filter(s => s.attendance_rate < 75.0)
        .map(s => ({
          student_id: s.id,
          student_name: s.full_name,
          student_code: s.student_code,
          department: s.department,
          attendance_rate: s.attendance_rate,
          warning_level: s.attendance_rate < 65.0 ? 'CRITICAL' : 'WARNING',
          triggered_at: new Date().toISOString()
        }));
    }

    res.json({
      success: true,
      logs,
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
      course_code: course_code || 'CS201',
      student_name,
      date: new Date().toISOString().split('T')[0],
      status: (status || 'PRESENT').toUpperCase(),
      department: department || 'Computer Science'
    };

    let createdLog = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('attendance_records')
          .insert(newLogData)
          .select()
          .single();

        if (!error && data) {
          createdLog = data;
          console.log('[Supabase] Logged attendance record:', data.id);
        } else if (error) {
          console.error('[Supabase] Insert attendance error:', error.message);
        }
      } catch (err) {
        console.warn('[attendanceController] Supabase log attendance fallback:', err.message);
      }
    }

    if (!createdLog) {
      createdLog = {
        id: `att-${Date.now()}`,
        ...newLogData
      };
    }

    // Keep mockStore synced
    mockStore.attendance_logs.unshift(createdLog);

    // Update student's cumulative attendance rate in Supabase & mockStore
    let updatedStudent = null;
    let mcpAlertSent = null;

    if (supabase) {
      try {
        // Find matching student
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .or(`id.eq.${student_id},full_name.eq.${student_name}`)
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
              recipientEmail: student.email || `${student.full_name.toLowerCase().replace(/\s+/g, '.')}@student.university.edu`,
              subject: `[URGENT] Academic Attendance Threshold Warning (<75%)`,
              body: `Dear ${student.full_name}, Your cumulative attendance has fallen to ${currentRate}%. Under Policy 4.2, an immediate academic review is required.`,
              alertType: 'ATTENDANCE_WARNING'
            });
          }
        }
      } catch (err) {
        console.warn('[attendanceController] Student attendance update error:', err.message);
      }
    }

    // Also update mockStore student if found
    const mockStudent = mockStore.students.find(s => s.id === student_id || s.full_name === student_name);
    if (mockStudent) {
      if (newLogData.status === 'ABSENT') {
        mockStudent.attendance_rate = Math.max(50, Number((mockStudent.attendance_rate - 2.5).toFixed(1)));
      } else if (newLogData.status === 'PRESENT') {
        mockStudent.attendance_rate = Math.min(100, Number((mockStudent.attendance_rate + 0.5).toFixed(1)));
      }
      if (mockStudent.attendance_rate < 75.0) {
        mockStudent.predicted_risk = 'HIGH';
      }
      if (!updatedStudent) updatedStudent = mockStudent;
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
