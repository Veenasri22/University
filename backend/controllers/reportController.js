import { generateReportSchema } from '../validators/schemas.js';
import { generateExecutiveReport } from '../services/geminiService.js';
import { supabase } from '../config/db.js';

export const generateReport = async (req, res, next) => {
  try {
    const validated = generateReportSchema.parse(req.body);

    let studentQuery = supabase.from('students').select('*');
    let facultyQuery = supabase.from('faculty').select('*');
    let courseQuery = supabase.from('courses').select('*');

    if (validated.department && validated.department !== 'ALL') {
      studentQuery = studentQuery.eq('department', validated.department);
      facultyQuery = facultyQuery.eq('department', validated.department);
      courseQuery = courseQuery.eq('department', validated.department);
    }

    const [{ data: students }, { data: faculty }, { data: courses }] = await Promise.all([
      studentQuery,
      facultyQuery,
      courseQuery
    ]);

    const deptStudents = students || [];
    const deptFaculty = faculty || [];
    const deptCourses = courses || [];

    const totalGpa = deptStudents.reduce((a, s) => a + Number(s.current_gpa || 0), 0);
    const averageGpa = deptStudents.length > 0 ? (totalGpa / deptStudents.length).toFixed(2) : '3.10';
    const highRiskCount = deptStudents.filter(s => s.predicted_risk === 'HIGH').length;

    const departmentData = {
      department: validated.department,
      studentCount: deptStudents.length,
      averageGpa,
      highRiskCount,
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
