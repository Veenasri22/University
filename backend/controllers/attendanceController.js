import { mockStore } from '../services/mockStore.js';
import { dispatchGmailAlert } from '../services/mcpService.js';

export const getAttendanceLogs = async (req, res, next) => {
  try {
    const { department } = req.query;
    let logs = [...mockStore.attendance_logs];

    if (department && department !== 'ALL') {
      logs = logs.filter(l => l.department === department);
    }

    const thresholdAlerts = mockStore.students
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

    const newLog = {
      id: `att-${Date.now()}`,
      course_code: course_code || 'CS201',
      student_name,
      date: new Date().toISOString().split('T')[0],
      status: status || 'PRESENT',
      department: department || 'Computer Science'
    };

    mockStore.attendance_logs.unshift(newLog);

    // Check if student's attendance drops below threshold
    const student = mockStore.students.find(s => s.id === student_id || s.full_name === student_name);
    let mcpAlertSent = null;

    if (student) {
      if (status === 'ABSENT') {
        student.attendance_rate = Math.max(50, Number((student.attendance_rate - 2.5).toFixed(1)));
      } else if (status === 'PRESENT') {
        student.attendance_rate = Math.min(100, Number((student.attendance_rate + 0.5).toFixed(1)));
      }

      if (student.attendance_rate < 75.0) {
        student.predicted_risk = 'HIGH';
        // Trigger MCP Gmail alert connector
        mcpAlertSent = await dispatchGmailAlert({
          recipientEmail: student.email,
          subject: `[URGENT] Academic Attendance Threshold Warning (<75%)`,
          body: `Dear ${student.full_name}, Your cumulative attendance has fallen to ${student.attendance_rate}%. Under Policy 4.2, an immediate academic review is required.`,
          alertType: 'ATTENDANCE_WARNING'
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Attendance recorded successfully',
      log: newLog,
      updatedStudent: student,
      mcpAlertSent
    });
  } catch (err) {
    next(err);
  }
};
