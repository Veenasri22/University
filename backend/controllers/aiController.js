import { aiAdvisorChatSchema, policySearchSchema, policyUploadSchema } from '../validators/schemas.js';
import { runMultiAgentAdvisor } from '../services/geminiService.js';
import { searchPolicies, uploadPolicy } from '../services/ragService.js';
import { scheduleGoogleCalendarMeeting, dispatchGmailAlert } from '../services/mcpService.js';
import { mockStore } from '../services/mockStore.js';
import { generateAdvisory } from '../services/aiService.js';
import { supabase } from '../config/db.js';
import crypto from 'crypto';


export const handleAdvisorChat = async (req, res, next) => {
  try {
    const validated = aiAdvisorChatSchema.parse(req.body);

    const studentContext = mockStore.students.find(s => s.id === validated.student_id) || mockStore.students[0];

    // Relevant RAG policy context matching message
    const policyResult = await searchPolicies({ query: validated.message });

    const aiResponse = await runMultiAgentAdvisor({
      message: validated.message,
      agentType: validated.agent_type,
      studentContext,
      policyContext: policyResult.matched_documents,
      chatHistory: validated.chat_history
    });

    // Check if user requested calendar booking or email alert dispatch
    let mcpAction = null;
    const msgLower = validated.message.toLowerCase();
    if (msgLower.includes('schedule') || msgLower.includes('calendar') || msgLower.includes('appointment') || msgLower.includes('meet')) {
      mcpAction = await scheduleGoogleCalendarMeeting({
        studentId: studentContext.id,
        studentName: studentContext.full_name,
        advisorName: 'Sarah Jenkins, M.Ed. (Academic Advisor)',
        requestedDate: '2026-08-03T10:00:00Z',
        topic: `${validated.agent_type} Consultation`
      });
    } else if (msgLower.includes('email') || msgLower.includes('alert') || msgLower.includes('notify')) {
      mcpAction = await dispatchGmailAlert({
        recipientEmail: studentContext.email,
        subject: `[Academic AI Advisor] Action Plan Summary (${validated.agent_type})`,
        body: `Summary of guidance: ${aiResponse.text.substring(0, 200)}...`,
        alertType: 'ADVISING_SUMMARY'
      });
    }

    res.json({
      success: true,
      agent: validated.agent_type,
      reply: aiResponse.text,
      citations: policyResult.matched_documents.map(d => ({ title: d.title, category: d.category })),
      mcpAction
    });
  } catch (err) {
    next(err);
  }
};

export const handlePolicySearch = async (req, res, next) => {
  try {
    const validated = policySearchSchema.parse(req.body);
    const result = await searchPolicies(validated);

    res.json({
      success: true,
      query: validated.query,
      results: result.matched_documents,
      ai_summary: result.ai_summary
    });
  } catch (err) {
    next(err);
  }
};

export const handlePolicyUpload = async (req, res, next) => {
  try {
    const validated = policyUploadSchema.parse(req.body);
    const newPolicy = await uploadPolicy(validated);

    res.status(201).json({
      success: true,
      message: 'Academic policy document indexed into vector store',
      policy: newPolicy
    });
  } catch (err) {
    next(err);
  }
};

export const scheduleMeetingDirect = async (req, res, next) => {
  try {
    const { studentName, advisorName, requestedDate, topic } = req.body;
    const result = await scheduleGoogleCalendarMeeting({
      studentName: studentName || 'Alex Rivera',
      advisorName: advisorName || 'Sarah Jenkins, M.Ed.',
      requestedDate,
      topic
    });

    res.json({
      success: true,
      message: 'Google Calendar invitation generated via MCP',
      calendarEvent: result
    });
  } catch (err) {
    next(err);
  }
};

export const handleGenerateAdvisory = async (req, res, next) => {
  try {
    const { entityId, payload } = req.body;

    if (!entityId || !payload) {
      return res.status(400).json({
        success: false,
        error: 'Both entityId and payload are required in request body'
      });
    }

    // Pass payload to AI Service
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

    // Insert record into Supabase PostgreSQL table ai_generated_advisories if client is active
    if (supabase) {
      const { data, error } = await supabase
        .from('ai_generated_advisories')
        .insert([{
          entity_id: entityId,
          risk_level: aiOutput.riskLevel,
          summary: aiOutput.summary,
          ai_output_json: aiOutput
        }])
        .select()
        .single();

      if (error) {
        console.warn('[Database] Supabase insert error for advisory, using fallback store:', error.message);
        mockStore.ai_generated_advisories.push(generatedRecord);
      } else if (data) {
        savedRecord = data;
      }
    } else {
      mockStore.ai_generated_advisories.push(generatedRecord);
    }

    return res.status(201).json({
      success: true,
      message: 'AI Assessment Advisory generated and stored successfully',
      data: savedRecord
    });
  } catch (err) {
    next(err);
  }
};

