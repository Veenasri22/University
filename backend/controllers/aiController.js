import crypto from 'crypto';
import { mockStore } from '../services/mockStore.js';
import { supabase } from '../config/db.js';
import { logAuditEvent, getAuditLogs } from '../services/auditService.js';
import { generateAdvisory } from '../services/aiService.js';
import { searchPolicies, uploadPolicy } from '../services/ragService.js';
import { scheduleGoogleCalendarMeeting, dispatchGmailAlert } from '../services/mcpService.js';
import { runMultiAgentAdvisor, generateAiAnswer } from '../services/geminiService.js';
import {
  predictStudentPerformance,
  generateAdvisorRecommendations,
  generateFacultyInsights,
  generateExecutiveAcademicReport,
  generateDiagnosticQuestions
} from '../services/geminiService.js';
import {
  aiAdvisorChatSchema,
  policySearchSchema,
  policyUploadSchema,
  aiPredictionRequestSchema,
  advisorRecommendationSchema,
  facultyInsightSchema,
  executiveReportSchema,
  diagnosticQuestionsSchema
} from '../validators/schemas.js';

// ─── HELPER: Save AI Report ───────────────────────────────────────────────────

async function saveAiReport({ generatedBy, department, reportType, rawInputPayload, aiResponse, confidenceScore, assumptions }) {
  const reportRecord = {
    id: `rpt-${crypto.randomUUID().slice(0, 8)}`,
    university_id: 'uni-001',
    department: department || 'Unknown',
    generated_by: generatedBy || 'system',
    report_type: reportType,
    raw_input_payload: rawInputPayload,
    ai_response: aiResponse,
    assumptions: assumptions || [],
    confidence_score: confidenceScore || null,
    is_verified_by_admin: false,
    verified_by: null,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('ai_academic_reports')
        .insert([{
          university_id: reportRecord.university_id,
          department_id: null,
          generated_by: reportRecord.generated_by,
          report_type: reportRecord.report_type,
          raw_input_payload: reportRecord.raw_input_payload,
          ai_response: reportRecord.ai_response,
          assumptions: reportRecord.assumptions,
          confidence_score: reportRecord.confidence_score,
          is_verified_by_admin: false
        }])
        .select()
        .single();

      if (!error && data) return data;
      console.warn('[AI Controller] Supabase report save warning, using in-memory:', error?.message);
    } catch (err) {
      console.warn('[AI Controller] Supabase error:', err.message);
    }
  }

  mockStore.ai_academic_reports.push(reportRecord);
  return reportRecord;
}

// ─── POST /api/ai/predict-performance ─────────────────────────────────────────

export const handlePredictPerformance = async (req, res, next) => {
  try {
    const validated = aiPredictionRequestSchema.parse(req.body);

    const aiResult = await predictStudentPerformance(validated);

    const report = await saveAiReport({
      generatedBy: req.user?.id || 'system',
      department: validated.department,
      reportType: 'Prediction',
      rawInputPayload: validated,
      aiResponse: aiResult,
      confidenceScore: aiResult.confidenceScore,
      assumptions: aiResult.assumptions
    });

    await logAuditEvent({
      actorId: req.user?.id,
      actorName: req.user?.full_name || 'System',
      action: 'AI_PREDICTION_GENERATED',
      targetEntity: 'ai_academic_reports',
      details: { studentId: validated.studentId, department: validated.department, riskLevel: aiResult.riskLevel },
      ipAddress: req.ip,
      supabase
    });

    return res.status(201).json({
      success: true,
      message: 'Student performance prediction generated successfully',
      reportId: report.id,
      prediction: aiResult,
      disclaimer: 'This AI-generated prediction requires verification by institutional administrators before any academic action is taken.'
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/advisor-recommendations ─────────────────────────────────────

export const handleAdvisorRecommendations = async (req, res, next) => {
  try {
    const validated = advisorRecommendationSchema.parse(req.body);

    const aiResult = await generateAdvisorRecommendations(validated);

    const report = await saveAiReport({
      generatedBy: req.user?.id || 'system',
      department: validated.department,
      reportType: 'Advisory',
      rawInputPayload: validated,
      aiResponse: aiResult,
      confidenceScore: aiResult.confidenceScore,
      assumptions: aiResult.assumptions
    });

    await logAuditEvent({
      actorId: req.user?.id,
      actorName: req.user?.full_name || 'System',
      action: 'AI_ADVISORY_GENERATED',
      targetEntity: 'ai_academic_reports',
      details: { studentId: validated.studentId, department: validated.department },
      ipAddress: req.ip,
      supabase
    });

    return res.status(201).json({
      success: true,
      message: 'Personalized advisor recommendations generated',
      reportId: report.id,
      recommendations: aiResult,
      disclaimer: 'All recommendations must be reviewed and approved by a qualified academic advisor before presentation to the student.'
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/faculty-insights ────────────────────────────────────────────

export const handleFacultyInsights = async (req, res, next) => {
  try {
    const validated = facultyInsightSchema.parse(req.body);

    const aiResult = await generateFacultyInsights(validated);

    const report = await saveAiReport({
      generatedBy: req.user?.id || 'system',
      department: validated.department,
      reportType: 'Faculty_Insight',
      rawInputPayload: validated,
      aiResponse: aiResult,
      confidenceScore: aiResult.confidenceScore,
      assumptions: aiResult.assumptions
    });

    await logAuditEvent({
      actorId: req.user?.id,
      actorName: req.user?.full_name || 'System',
      action: 'AI_FACULTY_INSIGHT_GENERATED',
      targetEntity: 'ai_academic_reports',
      details: { facultyId: validated.facultyId, department: validated.department },
      ipAddress: req.ip,
      supabase
    });

    return res.status(201).json({
      success: true,
      message: 'Faculty performance insight report generated',
      reportId: report.id,
      insights: aiResult,
      disclaimer: 'Faculty evaluation data must be reviewed by the Department Chair and Dean before any personnel decisions are made.'
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/executive-report ────────────────────────────────────────────

export const handleExecutiveReport = async (req, res, next) => {
  try {
    const validated = executiveReportSchema.parse(req.body);

    // Augment departmentData from mockStore if not provided
    const deptStudents = mockStore.students.filter(s => s.department === validated.department);
    const deptFaculty = mockStore.faculty.filter(f => f.department === validated.department);
    const enrichedDeptData = validated.departmentData || {
      totalStudents: deptStudents.length,
      avgGpa: deptStudents.length
        ? Number((deptStudents.reduce((s, st) => s + st.current_gpa, 0) / deptStudents.length).toFixed(2))
        : 3.0,
      avgAttendance: deptStudents.length
        ? Number((deptStudents.reduce((s, st) => s + st.attendance_rate, 0) / deptStudents.length).toFixed(1))
        : 85.0,
      atRiskCount: deptStudents.filter(s => s.predicted_risk === 'HIGH').length,
      facultyCount: deptFaculty.length,
      avgFacultyRating: deptFaculty.length
        ? Number((deptFaculty.reduce((s, f) => s + f.teaching_rating, 0) / deptFaculty.length).toFixed(2))
        : 4.0,
      avgSyllabusCoverage: 78.5
    };

    const aiResult = await generateExecutiveAcademicReport({
      ...validated,
      departmentData: enrichedDeptData
    });

    const report = await saveAiReport({
      generatedBy: req.user?.id || 'system',
      department: validated.department,
      reportType: 'Executive_Summary',
      rawInputPayload: { ...validated, departmentData: enrichedDeptData },
      aiResponse: aiResult,
      confidenceScore: aiResult.confidenceScore,
      assumptions: aiResult.assumptions
    });

    await logAuditEvent({
      actorId: req.user?.id,
      actorName: req.user?.full_name || 'System',
      action: 'AI_EXECUTIVE_REPORT_GENERATED',
      targetEntity: 'ai_academic_reports',
      details: { department: validated.department, reportType: validated.reportType },
      ipAddress: req.ip,
      supabase
    });

    return res.status(201).json({
      success: true,
      message: 'Executive academic report generated successfully',
      reportId: report.id,
      report: aiResult,
      disclaimer: 'This AI-generated executive report requires verification and approval by designated university administrators before institutional action.'
    });
  } catch (err) {
    next(err);
  }
};

// ─── POST /api/ai/diagnostic-questions ────────────────────────────────────────

export const handleDiagnosticQuestions = async (req, res, next) => {
  try {
    const validated = diagnosticQuestionsSchema.parse(req.body);

    const aiResult = await generateDiagnosticQuestions(validated);

    await logAuditEvent({
      actorId: req.user?.id,
      actorName: req.user?.full_name || 'System',
      action: 'AI_DIAGNOSTIC_GENERATED',
      targetEntity: 'ai_diagnostic_sessions',
      details: { entityType: validated.entityType, context: validated.context.substring(0, 80) },
      ipAddress: req.ip,
      supabase
    });

    return res.status(200).json({
      success: true,
      message: 'Diagnostic questions generated for data quality review',
      entityType: validated.entityType,
      diagnostics: aiResult
    });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/reports ──────────────────────────────────────────────────────

export const getAiReports = async (req, res, next) => {
  try {
    const { reportType, department, verified } = req.query;

    if (supabase) {
      try {
        let query = supabase.from('ai_academic_reports').select('*').order('created_at', { ascending: false });
        if (reportType) query = query.eq('report_type', reportType);
        if (department) query = query.eq('department', department);
        if (verified !== undefined) query = query.eq('is_verified_by_admin', verified === 'true');

        const { data, error } = await query.limit(50);
        if (!error && data) return res.json({ success: true, reports: data, total: data.length });
      } catch (err) {
        console.warn('[AI Controller] Supabase reports fetch error:', err.message);
      }
    }

    let reports = [...mockStore.ai_academic_reports].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (reportType) reports = reports.filter(r => r.report_type === reportType);
    if (department) reports = reports.filter(r => r.department === department);
    if (verified !== undefined) reports = reports.filter(r => r.is_verified_by_admin === (verified === 'true'));

    return res.json({ success: true, reports, total: reports.length });
  } catch (err) {
    next(err);
  }
};

// ─── PATCH /api/ai/reports/:id/verify ─────────────────────────────────────────

export const verifyAiReport = async (req, res, next) => {
  try {
    const { id } = req.params;
    const verifiedBy = req.user?.id || 'admin';
    const verifierName = req.user?.full_name || 'Administrator';

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('ai_academic_reports')
          .update({ is_verified_by_admin: true, verified_by: verifiedBy })
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          await logAuditEvent({
            actorId: verifiedBy,
            actorName: verifierName,
            action: 'AI_REPORT_VERIFIED',
            targetEntity: 'ai_academic_reports',
            details: { reportId: id },
            ipAddress: req.ip,
            supabase
          });
          return res.json({ success: true, message: 'AI report marked as verified', report: data });
        }
      } catch (err) {
        console.warn('[AI Controller] Supabase verify error:', err.message);
      }
    }

    const report = mockStore.ai_academic_reports.find(r => r.id === id);
    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    report.is_verified_by_admin = true;
    report.verified_by = verifiedBy;
    report.verified_at = new Date().toISOString();

    await logAuditEvent({
      actorId: verifiedBy,
      actorName: verifierName,
      action: 'AI_REPORT_VERIFIED',
      targetEntity: 'ai_academic_reports',
      details: { reportId: id },
      ipAddress: req.ip,
      supabase
    });

    return res.json({ success: true, message: 'AI report marked as verified', report });
  } catch (err) {
    next(err);
  }
};

// ─── GET /api/ai/audit-logs ───────────────────────────────────────────────────

export const handleGetAuditLogs = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = await getAuditLogs(limit, supabase);
    return res.json({ success: true, logs, total: logs.length });
  } catch (err) {
    next(err);
  }
};

// ─── LEGACY HANDLERS (Preserved for existing routes) ─────────────────────────

export const handleAdvisorChat = async (req, res, next) => {
  try {
    const validated = aiAdvisorChatSchema.parse(req.body);
    const history = (validated.chat_history || []).map(h => ({
      sender: h.sender === 'user' ? 'user' : 'assistant',
      message_text: h.text || h.message_text || ''
    }));

    const agentType = validated.agent_type || 'GENERAL';
    const advisorResult = await runMultiAgentAdvisor({
      message: validated.message,
      agentType,
      chatHistory: history
    });

    res.json({ success: true, agent: advisorResult.agent || agentType, reply: advisorResult.text });
  } catch (err) {
    next(err);
  }
};

export const handlePolicySearch = async (req, res, next) => {
  try {
    const validated = policySearchSchema.parse(req.body);
    const result = await searchPolicies(validated);
    res.json({ success: true, query: validated.query, results: result.matched_documents, ai_summary: result.ai_summary });
  } catch (err) {
    next(err);
  }
};

export const handlePolicyUpload = async (req, res, next) => {
  try {
    const validated = policyUploadSchema.parse(req.body);
    const newPolicy = await uploadPolicy(validated);
    res.status(201).json({ success: true, message: 'Academic policy document indexed', policy: newPolicy });
  } catch (err) {
    next(err);
  }
};

export const scheduleMeetingDirect = async (req, res, next) => {
  try {
    const { studentName, advisorName, requestedDate, topic } = req.body;
    const result = await scheduleGoogleCalendarMeeting({ studentName: studentName || 'Student', advisorName: advisorName || 'Advisor', requestedDate, topic });
    res.json({ success: true, message: 'Google Calendar invitation generated via MCP', calendarEvent: result });
  } catch (err) {
    next(err);
  }
};

export const handleGenerateAdvisory = async (req, res, next) => {
  try {
    const { entityId, payload } = req.body;
    if (!entityId || !payload) {
      return res.status(400).json({ success: false, error: 'Both entityId and payload are required' });
    }

    const aiOutput = await generateAdvisory({ entityId, payload });
    const generatedRecord = {
      id: crypto.randomUUID(),
      entity_id: entityId,
      risk_level: aiOutput.riskLevel,
      summary: aiOutput.summary,
      ai_output_json: aiOutput,
      created_at: new Date().toISOString()
    };

    let savedRecord = generatedRecord;
    if (supabase) {
      const { data, error } = await supabase
        .from('ai_generated_advisories')
        .insert([{ entity_id: entityId, risk_level: aiOutput.riskLevel, summary: aiOutput.summary, ai_output_json: aiOutput }])
        .select().single();
      if (!error && data) savedRecord = data;
      else mockStore.ai_generated_advisories.push(generatedRecord);
    } else {
      mockStore.ai_generated_advisories.push(generatedRecord);
    }

    return res.status(201).json({ success: true, message: 'AI Assessment Advisory generated', data: savedRecord });
  } catch (err) {
    next(err);
  }
};

export const handleAskAi = async (req, res, next) => {
  try {
    const { prompt, sessionId: reqSessionId } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ success: false, error: 'prompt is required in request body.' });
    }

    const trimmedPrompt = prompt.trim();
    let currentSessionId = reqSessionId;

    if (!currentSessionId) {
      const sessionTitle = trimmedPrompt.length > 40 ? trimmedPrompt.substring(0, 37) + '...' : trimmedPrompt;
      currentSessionId = crypto.randomUUID();

      if (supabase) {
        const { data: newSession, error } = await supabase.from('ai_sessions').insert([{ title: sessionTitle }]).select().single();
        if (!error && newSession) currentSessionId = newSession.id;
        else mockStore.ai_sessions.push({ id: currentSessionId, title: sessionTitle, created_at: new Date().toISOString() });
      } else {
        mockStore.ai_sessions.push({ id: currentSessionId, title: sessionTitle, created_at: new Date().toISOString() });
      }
    }

    const userMsgRecord = { id: crypto.randomUUID(), session_id: currentSessionId, sender: 'user', message_text: trimmedPrompt, created_at: new Date().toISOString() };

    if (supabase) {
      const { error } = await supabase.from('ai_chat_messages').insert([{ session_id: currentSessionId, sender: 'user', message_text: trimmedPrompt }]);
      if (error) mockStore.ai_chat_messages.push(userMsgRecord);
    } else {
      mockStore.ai_chat_messages.push(userMsgRecord);
    }

    let history = [];
    if (supabase) {
      const { data } = await supabase.from('ai_chat_messages').select('sender, message_text').eq('session_id', currentSessionId).order('created_at', { ascending: true });
      if (data) history = data;
    } else {
      history = mockStore.ai_chat_messages.filter(m => m.session_id === currentSessionId).map(m => ({ sender: m.sender, message_text: m.message_text }));
    }

    const aiResponseText = await generateAiAnswer(trimmedPrompt, history);

    const assistantMsgRecord = { id: crypto.randomUUID(), session_id: currentSessionId, sender: 'assistant', message_text: aiResponseText, created_at: new Date().toISOString() };

    if (supabase) {
      const { error } = await supabase.from('ai_chat_messages').insert([{ session_id: currentSessionId, sender: 'assistant', message_text: aiResponseText }]);
      if (error) mockStore.ai_chat_messages.push(assistantMsgRecord);
    } else {
      mockStore.ai_chat_messages.push(assistantMsgRecord);
    }

    let allMessages = supabase
      ? (await supabase.from('ai_chat_messages').select('*').eq('session_id', currentSessionId).order('created_at', { ascending: true })).data || []
      : mockStore.ai_chat_messages.filter(m => m.session_id === currentSessionId);

    return res.status(200).json({ success: true, sessionId: currentSessionId, aiResponse: aiResponseText, messages: allMessages });
  } catch (err) {
    next(err);
  }
};

export const getAiSessions = async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase.from('ai_sessions').select('*').order('created_at', { ascending: false });
      if (!error && data) return res.json({ success: true, sessions: data });
    }
    return res.json({ success: true, sessions: mockStore.ai_sessions });
  } catch (err) {
    next(err);
  }
};

export const getSessionMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    if (supabase) {
      const { data, error } = await supabase.from('ai_chat_messages').select('*').eq('session_id', sessionId).order('created_at', { ascending: true });
      if (!error && data) return res.json({ success: true, messages: data });
    }
    const messages = mockStore.ai_chat_messages.filter(m => m.session_id === sessionId);
    return res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};
