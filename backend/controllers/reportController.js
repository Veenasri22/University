import { generateReportSchema } from '../validators/schemas.js';
import { generateExecutiveReport } from '../services/geminiService.js';
import { mockStore } from '../services/mockStore.js';

export const generateReport = async (req, res, next) => {
  try {
    const validated = generateReportSchema.parse(req.body);

    const deptStudents = mockStore.students.filter(s => validated.department === 'ALL' || s.department === validated.department);
    const deptFaculty = mockStore.faculty.filter(f => validated.department === 'ALL' || f.department === validated.department);
    const deptCourses = mockStore.courses.filter(c => validated.department === 'ALL' || c.department === validated.department);

    const departmentData = {
      department: validated.department,
      studentCount: deptStudents.length,
      averageGpa: deptStudents.length ? (deptStudents.reduce((a, s) => a + s.current_gpa, 0) / deptStudents.length).toFixed(2) : 3.10,
      highRiskCount: deptStudents.filter(s => s.predicted_risk === 'HIGH').length,
      facultyCount: deptFaculty.length,
      coursesTracked: deptCourses.length
    };

    const report = await generateExecutiveReport({
      department: validated.department,
      timeframe: validated.timeframe,
      reportType: validated.report_type,
      departmentData
    });

    res.json({
      success: true,
      reportType: validated.report_type,
      generatedAt: new Date().toISOString(),
      report
    });
  } catch (err) {
    next(err);
  }
};
