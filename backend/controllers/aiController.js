import { aiAdvisorChatSchema, policySearchSchema, policyUploadSchema } from '../validators/schemas.js';
import { runMultiAgentAdvisor, generateAiAnswer } from '../services/geminiService.js';
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

/**
 * Controller for POST /api/ai/ask
 * Handles session creation, context building, Gemini AI answer generation,
 * and direct database insertion into ai_chat_messages. Zero dummy data.
 */
export const handleAskAi = async (req, res, next) => {
  try {
    const { prompt, sessionId: reqSessionId } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required in request body.'
      });
    }

    const trimmedPrompt = prompt.trim();
    let currentSessionId = reqSessionId;

    // 1. If sessionId is missing or null, create a new row in ai_sessions
    if (!currentSessionId) {
      const sessionTitle = trimmedPrompt.length > 40 ? trimmedPrompt.substring(0, 37) + '...' : trimmedPrompt;

      if (supabase) {
        const { data: newSession, error: sessionErr } = await supabase
          .from('ai_sessions')
          .insert([{ title: sessionTitle }])
          .select()
          .single();

        if (!sessionErr && newSession) {
          currentSessionId = newSession.id;
        } else {
          console.warn('[AI Controller] Supabase create session warning, using fallback:', sessionErr?.message);
          currentSessionId = crypto.randomUUID();
          mockStore.ai_sessions.push({ id: currentSessionId, title: sessionTitle, created_at: new Date().toISOString() });
        }
      } else {
        currentSessionId = crypto.randomUUID();
        mockStore.ai_sessions.push({ id: currentSessionId, title: sessionTitle, created_at: new Date().toISOString() });
      }
    }

    // 2. Insert user's prompt into ai_chat_messages (sender: 'user')
    const userMsgRecord = {
      id: crypto.randomUUID(),
      session_id: currentSessionId,
      sender: 'user',
      message_text: trimmedPrompt,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error: userMsgErr } = await supabase
        .from('ai_chat_messages')
        .insert([{
          session_id: currentSessionId,
          sender: 'user',
          message_text: trimmedPrompt
        }]);

      if (userMsgErr) {
        console.warn('[AI Controller] Supabase save user message warning:', userMsgErr.message);
        mockStore.ai_chat_messages.push(userMsgRecord);
      }
    } else {
      mockStore.ai_chat_messages.push(userMsgRecord);
    }

    // 3. Fetch past conversation history for context
    let history = [];
    if (supabase) {
      const { data: historyData } = await supabase
        .from('ai_chat_messages')
        .select('sender, message_text')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (historyData) history = historyData;
    } else {
      history = mockStore.ai_chat_messages
        .filter(m => m.session_id === currentSessionId)
        .map(m => ({ sender: m.sender, message_text: m.message_text }));
    }

    // 4. Pass user prompt + history context to generateAiAnswer()
    const aiResponseText = await generateAiAnswer(trimmedPrompt, history);

    // 5. Save Gemini answer directly into ai_chat_messages (sender: 'assistant')
    const assistantMsgRecord = {
      id: crypto.randomUUID(),
      session_id: currentSessionId,
      sender: 'assistant',
      message_text: aiResponseText,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error: assistantMsgErr } = await supabase
        .from('ai_chat_messages')
        .insert([{
          session_id: currentSessionId,
          sender: 'assistant',
          message_text: aiResponseText
        }]);

      if (assistantMsgErr) {
        console.warn('[AI Controller] Supabase save assistant message warning:', assistantMsgErr.message);
        mockStore.ai_chat_messages.push(assistantMsgRecord);
      }
    } else {
      mockStore.ai_chat_messages.push(assistantMsgRecord);
    }

    // 6. Fetch full updated message list
    let allMessages = [];
    if (supabase) {
      const { data: fullMsgs } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', currentSessionId)
        .order('created_at', { ascending: true });

      if (fullMsgs) allMessages = fullMsgs;
    } else {
      allMessages = mockStore.ai_chat_messages.filter(m => m.session_id === currentSessionId);
    }

    return res.status(200).json({
      success: true,
      sessionId: currentSessionId,
      aiResponse: aiResponseText,
      messages: allMessages
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller for GET /api/ai/sessions
 */
export const getAiSessions = async (req, res, next) => {
  try {
    if (supabase) {
      const { data, error } = await supabase
        .from('ai_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ success: true, sessions: data });
      }
    }

    return res.json({ success: true, sessions: mockStore.ai_sessions });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller for GET /api/ai/sessions/:sessionId/messages
 */
export const getSessionMessages = async (req, res, next) => {
  try {
    const { sessionId } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return res.json({ success: true, messages: data });
      }
    }

    const messages = mockStore.ai_chat_messages.filter(m => m.session_id === sessionId);
    return res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};


