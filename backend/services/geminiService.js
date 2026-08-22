import { groq, GROQ_MODEL } from '../config/groq.js';

// ─── MASTER SYSTEM INSTRUCTION ───────────────────────────────────────────────

const ACADEMIC_INTELLIGENCE_SYSTEM = `You are the Lead Academic Intelligence Officer & Predictive Systems Analyst for a modern Higher Education Institution.
Your objective is to analyze complex academic data streams—including student attendance, assessment marks, CGPA trends, curriculum delivery pace, and faculty teaching workloads—to generate actionable, hyper-accurate, and data-driven institutional insights.

OPERATIONAL CONSTRAINTS:
1. Strict JSON Output: You MUST return responses strictly in valid JSON format matching the requested schema. No markdown code blocks outside JSON, no conversational text outside JSON.
2. Explicit Assumptions: You MUST explicitly list all assumptions made when filling in missing data or projecting future performance trends.
3. Confidence Level: You MUST provide an objective confidence score between 0.00 and 1.00 based on completeness.
4. Human Verification Rule: Every recommendation must explicitly advise verification by institutional administrators before execution.`;

const ADVISOR_SYSTEM = `You are an empathetic, expert AI Academic Advisor. Provide clear, accurate, and direct answers to user questions.`;

// ─── GROQ COMPLETION HELPERS ──────────────────────────────────────────────────

async function generateGroqCompletion(prompt, systemInstruction = ADVISOR_SYSTEM) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key') {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const candidateModels = [GROQ_MODEL, 'openai/gpt-oss-120b', 'groq/compound', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
  for (const m of candidateModels) {
    try {
      const response = await groq.chat.completions.create({
        model: m,
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      let content = response.choices[0]?.message?.content?.trim() || '';
      content = content.replace(/<Think>[\s\S]*?<\/Think>/gi, '').trim();
      return content;
    } catch (e) {
      // try next candidate
    }
  }
  throw new Error('No compatible Groq completion model responded.');
}

async function generateGroqStructured(prompt, schemaInstruction, systemInstruction = ACADEMIC_INTELLIGENCE_SYSTEM) {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key') {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const fullSystemPrompt = `${systemInstruction}\n\nSchema Guidelines: ${schemaInstruction}`;
  const candidateModels = [GROQ_MODEL, 'openai/gpt-oss-120b', 'groq/compound', 'openai/gpt-oss-20b', 'qwen/qwen3.6-27b'];
  for (const m of candidateModels) {
    try {
      const response = await groq.chat.completions.create({
        model: m,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: fullSystemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3
      });

      const content = response.choices[0]?.message?.content?.trim();
      return JSON.parse(content);
    } catch (e) {
      // try next candidate
    }
  }
  throw new Error('No compatible Groq structured model responded.');
}

// ─── 1. STUDENT PERFORMANCE RISK PREDICTION ───────────────────────────────────

export async function predictStudentPerformance({ studentId, department, program, semester, cgpa, attendancePct, assessments }) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const prompt = `Analyze student performance:
Department: ${department} | Program: ${program} | Semester: ${semester}
CGPA: ${cgpa} | Attendance: ${attendancePct}%
Assessments: ${JSON.stringify(assessments)}

Return a JSON object with:
"predictedCGPA": number,
"riskLevel": ("Critical"|"High"|"Moderate"|"Low"|"On-Track"),
"dropoutProbability": number (0.0 to 1.0),
"keyRiskFactors": string[],
"strengths": string[],
"possibleRootCauses": string[],
"confidenceScore": number (0.0 to 1.0),
"assumptions": string[]`;

      const result = await generateGroqStructured(prompt, 'Ensure all required keys are present.');
      return result;
    } catch (err) {
      console.error('[Groq] predictStudentPerformance error, using heuristic:', err.message);
    }
  }

  // Heuristic Fallback
  const gpa = Number(cgpa || 0);
  const att = Number(attendancePct || 0);

  let riskLevel = 'On-Track';
  let dropoutProbability = 0.04;
  let predictedCGPA = Math.min(4.0, gpa + 0.05);
  const keyRiskFactors = [];
  const strengths = [];

  if (gpa < 2.0 || att < 60) {
    riskLevel = 'Critical';
    dropoutProbability = 0.48;
    predictedCGPA = Math.max(1.5, gpa - 0.3);
    keyRiskFactors.push(`CGPA ${gpa.toFixed(2)} critically low`);
    if (att < 60) keyRiskFactors.push(`Attendance ${att.toFixed(1)}% below 75% threshold`);
  } else if (gpa < 2.5 || att < 75) {
    riskLevel = 'High';
    dropoutProbability = 0.28;
    predictedCGPA = Math.max(1.8, gpa - 0.2);
    keyRiskFactors.push(`GPA ${gpa.toFixed(2)} below warning threshold 2.50`);
  } else {
    strengths.push(`Good GPA ${gpa.toFixed(2)} and attendance ${att.toFixed(1)}%`);
  }

  return {
    predictedCGPA: Number(predictedCGPA.toFixed(2)),
    riskLevel,
    dropoutProbability: Number(dropoutProbability.toFixed(2)),
    keyRiskFactors: keyRiskFactors.length ? keyRiskFactors : ['No critical risk factors identified'],
    strengths: strengths.length ? strengths : ['Stable academic standing'],
    possibleRootCauses: ['Insufficient historical data for root cause analysis'],
    confidenceScore: 0.75,
    assumptions: ['Extrapolated from current semester data']
  };
}

// ─── 2. PERSONALIZED ADVISOR RECOMMENDATIONS ─────────────────────────────────

export async function generateAdvisorRecommendations({ studentId, department, program, semester, cgpa, attendancePct, riskLevel, specificConcerns }) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const prompt = `Generate advisor recommendations for student in ${program}, ${department}, Semester ${semester}. CGPA: ${cgpa}, Attendance: ${attendancePct}%, Risk: ${riskLevel}. Concerns: ${specificConcerns ? specificConcerns.join(', ') : 'None'}.

Return JSON object:
{
  "immediateActions": string[],
  "studyPlan": { "weeklySchedule": string, "priorityCourses": string[], "studyTechniques": string[] },
  "courseSuggestions": string[],
  "interventionTimeline": Array<{ "week": string, "milestone": string, "responsible": string }>,
  "supportResources": string[],
  "targetGPA": number,
  "confidenceScore": number,
  "assumptions": string[]
}`;

      return await generateGroqStructured(prompt, 'Return exact JSON structure requested.');
    } catch (err) {
      console.error('[Groq] generateAdvisorRecommendations error, using heuristic:', err.message);
    }
  }

  const isHighRisk = (riskLevel || '').toUpperCase().includes('HIGH') || (riskLevel || '').toUpperCase().includes('CRITICAL');
  return {
    immediateActions: isHighRisk
      ? ['Schedule emergency advising session', 'Enroll in mandatory peer tutoring']
      : ['Review progress with advisor', 'Attend professor office hours'],
    studyPlan: {
      weeklySchedule: 'Dedicated 3-hour daily study blocks and weekly instructor check-ins',
      priorityCourses: specificConcerns?.length ? specificConcerns : [`Core ${program} requirements`],
      studyTechniques: ['Spaced repetition', 'Active recall', 'Pomodoro technique']
    },
    courseSuggestions: ['Maintain current course load', 'Add academic success module if needed'],
    interventionTimeline: [
      { week: 'Week 1-2', milestone: 'Initial advisor meeting', responsible: 'Academic Advisor' },
      { week: 'Week 3-6', milestone: 'Peer tutoring sessions', responsible: 'Student + Faculty' }
    ],
    supportResources: ['University Success Center', 'Department Faculty Office Hours'],
    targetGPA: Number(Math.min(4.0, (cgpa || 3.0) + 0.3).toFixed(2)),
    confidenceScore: 0.75,
    assumptions: ['Evaluated based on current GPA and attendance input']
  };
}

// ─── 3. FACULTY PERFORMANCE INSIGHTS ──────────────────────────────────────────

export async function generateFacultyInsights({ facultyId, facultyName, department, academicTerm, weeklyTeachingHours, avgStudentFeedback, courseCount, researchPublications }) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const prompt = `Analyze faculty performance: ${facultyName}, ${department}, Teaching Hours: ${weeklyTeachingHours}, Feedback: ${avgStudentFeedback}/5.0, Publications: ${researchPublications}.

Return JSON:
{
  "effectivenessRating": ("Exceptional"|"Above Average"|"Satisfactory"|"Needs Improvement"|"Critical"),
  "workloadStatus": ("Underloaded"|"Balanced"|"Overloaded"|"Critical Overload"),
  "burnoutRisk": ("Low"|"Moderate"|"High"|"Critical"),
  "keyStrengths": string[],
  "areasForImprovement": string[],
  "workloadRecommendations": string[],
  "studentOutcomeImpact": string,
  "confidenceScore": number,
  "assumptions": string[]
}`;

      return await generateGroqStructured(prompt, 'Return exact JSON structure.');
    } catch (err) {
      console.error('[Groq] generateFacultyInsights error, using heuristic:', err.message);
    }
  }

  return {
    effectivenessRating: avgStudentFeedback >= 4.0 ? 'Above Average' : 'Satisfactory',
    workloadStatus: weeklyTeachingHours > 40 ? 'Overloaded' : 'Balanced',
    burnoutRisk: weeklyTeachingHours > 40 ? 'High' : 'Low',
    keyStrengths: [`Student feedback rating ${avgStudentFeedback}/5.0`],
    areasForImprovement: ['Optimize workload balance'],
    workloadRecommendations: ['Maintain teaching workload within 40 hours limit'],
    studentOutcomeImpact: 'Positive student engagement observed.',
    confidenceScore: 0.80,
    assumptions: ['Based on current teaching hours and feedback metrics']
  };
}

// ─── 4. EXECUTIVE ACADEMIC REPORT ─────────────────────────────────────────────

export async function generateExecutiveAcademicReport({ universityName, department, academicTerm, reportType, departmentData }) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const prompt = `Generate ${reportType} report for ${universityName}, Department: ${department}, Term: ${academicTerm}. Data: ${JSON.stringify(departmentData || {})}.

Return JSON:
{
  "executiveSummary": string,
  "attendanceTrends": string,
  "curriculumCompletionStatus": string,
  "facultyEffectivenessRating": string,
  "academicAlerts": Array<{ "alertType": string, "severity": string, "affectedDepartment": string, "actionRequired": string }>,
  "recommendations": { "forStudents": string[], "forFaculty": string[], "forDepartmentHeads": string[], "forUniversityLeadership": string[] },
  "monitoringSchedule": Array<{ "milestone": string, "frequency": string, "responsibleParty": string }>,
  "assumptions": string[],
  "confidenceScore": number
}`;

      return await generateGroqStructured(prompt, 'Return valid executive report JSON.');
    } catch (err) {
      console.error('[Groq] generateExecutiveAcademicReport error, using heuristic:', err.message);
    }
  }

  const data = departmentData || {};
  return {
    executiveSummary: `The ${department} department maintains an average attendance rate of ${data.avgAttendance || 85}% and GPA of ${data.avgGpa || 3.1}.`,
    attendanceTrends: 'Departmental attendance remains stable above threshold.',
    curriculumCompletionStatus: 'Syllabus completion is progressing according to term timeline.',
    facultyEffectivenessRating: 'Faculty members are operating within expected institutional standards.',
    academicAlerts: [
      { alertType: 'Attendance Notice', severity: 'Moderate', affectedDepartment: department, actionRequired: 'Monitor students with attendance below 75%' }
    ],
    recommendations: {
      forStudents: ['Maintain attendance above 85%'],
      forFaculty: ['Submit weekly attendance logs'],
      forDepartmentHeads: ['Review mid-term syllabus progress'],
      forUniversityLeadership: ['Support department academic advising']
    },
    monitoringSchedule: [
      { milestone: 'Weekly Attendance Review', frequency: 'Weekly', responsibleParty: 'Department Admin' }
    ],
    assumptions: ['Calculated from current active term metrics'],
    confidenceScore: 0.80
  };
}

// ─── 5. DIAGNOSTIC QUESTIONS GENERATOR ───────────────────────────────────────

export async function generateDiagnosticQuestions({ context, entityType, dataSnapshot }) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const prompt = `Review ${entityType} context: ${context}, Snapshot: ${JSON.stringify(dataSnapshot || {})}.

Return JSON:
{
  "diagnosticQuestions": Array<{ "question": string, "rationale": string, "priority": string, "targetAudience": string }>,
  "dataGapsIdentified": string[],
  "recommendedDataSources": string[],
  "estimatedDataCompleteness": number
}`;

      return await generateGroqStructured(prompt, 'Return valid diagnostic questions JSON.');
    } catch (err) {
      console.error('[Groq] generateDiagnosticQuestions error, using heuristic:', err.message);
    }
  }

  return {
    diagnosticQuestions: [
      { question: `Are there any unreported extenuating factors for this ${entityType}?`, rationale: 'Validates quantitative metric anomalies', priority: 'High', targetAudience: 'Department Advisor' }
    ],
    dataGapsIdentified: ['Historical engagement records'],
    recommendedDataSources: ['Student Information System', 'LMS activity logs'],
    estimatedDataCompleteness: 0.70
  };
}

// ─── LEGACY FUNCTIONS ─────────────────────────────────────────────────────────

export async function predictStudentRisk(studentData) {
  return predictStudentPerformance({
    studentId: studentData.id || 'unknown',
    department: studentData.department || 'Computer Science',
    program: studentData.program || 'Computer Science B.S.',
    semester: studentData.semester || 4,
    cgpa: studentData.current_gpa || 0,
    attendancePct: studentData.attendance_rate || 0,
    assessments: studentData.assessments || []
  });
}

export async function runMultiAgentAdvisor({ message, agentType, studentContext, policyContext, chatHistory }) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const snapshot = await getLiveUniversitySnapshot();
      const historyStr = (chatHistory || []).map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.message_text || m.text || ''}`).join('\n');
      const fullPrompt = `${historyStr ? historyStr + '\n' : ''}User: ${message}\nAssistant:`;
      const systemInstruction = `You are an expert AI Academic Advisor (${agentType || 'GENERAL'}). Answer user queries accurately using the live real-time institutional data below:\n\n${snapshot}`;
      const text = await generateGroqCompletion(fullPrompt, systemInstruction);
      return { text, agent: agentType };
    } catch (e) {
      console.error('[Groq] runMultiAgentAdvisor error:', e.message);
    }
  }
  return { text: `Regarding your query "${message}": Please consult your department academic advisor for specific guidance.`, agent: agentType };
}

export async function generateExecutiveReport({ department, timeframe, reportType, departmentData }) {
  return generateExecutiveAcademicReport({
    universityName: 'University',
    department,
    academicTerm: timeframe,
    reportType,
    departmentData
  });
}

import { getLiveUniversitySnapshot } from './chatPromptService.js';

export async function generateAiAnswer(userPrompt, conversationHistory = []) {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const snapshot = await getLiveUniversitySnapshot();
      const historyStr = (conversationHistory || []).map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.message_text}`).join('\n');
      const prompt = `${historyStr ? historyStr + '\n' : ''}User: ${userPrompt}\nAssistant:`;
      const systemInstruction = `You are the Lead University AI Academic Advisor. Answer user questions accurately with real-time academic data and clear guidelines.\n\n${snapshot}`;
      const text = await generateGroqCompletion(prompt, systemInstruction);
      return text;
    } catch (err) {
      console.error('[Groq] generateAiAnswer error:', err.message);
    }
  }

  return `Thank you for your question regarding "${userPrompt}". Please review course guidelines or check the Performance & Syllabus Tracker.`;
}
