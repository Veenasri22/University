import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { groq, GROQ_MODEL } from '../config/groq.js';
import { supabase } from '../config/db.js';
import { getRoleSystemPrompt } from '../services/chatPromptService.js';
import { JWT_SECRET } from '../middleware/authMiddleware.js';

/**
 * Authenticate user from header token (Supabase auth or local JWT).
 */
async function resolveAuthenticatedUser(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  if (!token) return null;

  // 1. Try Supabase Auth
  if (supabase) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        // Fetch profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, department')
          .eq('id', user.id)
          .single();

        return {
          id: user.id,
          email: user.email,
          full_name: profile?.full_name || user.user_metadata?.full_name || 'Scholar',
          role: profile?.role || user.user_metadata?.role || 'STUDENT',
          department: profile?.department || 'Academic Affairs'
        };
      }
    } catch (e) {
      // Continue to local JWT fallback
    }
  }

  // 2. Try App JWT Secret
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded && decoded.id) {
      if (supabase) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, role, department')
          .eq('id', decoded.id)
          .single();

        if (profile) {
          return {
            id: profile.id,
            email: decoded.email,
            full_name: profile.full_name,
            role: profile.role,
            department: profile.department || 'Academic Affairs'
          };
        }
      }

      return {
        id: decoded.id,
        email: decoded.email || 'user@university.edu',
        full_name: decoded.full_name || decoded.name || 'Scholar',
        role: decoded.role || 'STUDENT',
        department: decoded.department || 'Academic Affairs'
      };
    }
  } catch (err) {
    // Invalid token
  }

  return null;
}

/**
 * POST /api/ai/chat-stream
 * Server-Sent Events (SSE) streaming endpoint powered by Groq llama-3.3-70b-versatile
 */
export async function handleChatStream(req, res) {
  // Set SSE Headers
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Helper for SSE frames
  const sendEvent = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const user = await resolveAuthenticatedUser(req);
  if (!user) {
    sendEvent({ type: 'error', error: 'Unauthorized: Valid authentication token is required.' });
    return res.end();
  }

  const { message, sessionId } = req.body || {};
  if (!message || !message.trim()) {
    sendEvent({ type: 'error', error: 'Message content is required.' });
    return res.end();
  }

  const userRole = (user.role || 'STUDENT').toUpperCase();
  const userName = user.full_name || 'Scholar';
  const department = user.department || 'Academic Affairs';

  try {
    let currentSessionId = sessionId;

    // 1. Create session if not provided
    if (!currentSessionId && supabase) {
      const generatedTitle = message.slice(0, 40).trim() + (message.length > 40 ? '...' : '');
      const newSessionId = crypto.randomUUID();

      const { data: newSession, error: sessErr } = await supabase
        .from('chat_sessions')
        .insert({
          id: newSessionId,
          user_id: user.id,
          title: generatedTitle,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!sessErr && newSession) {
        currentSessionId = newSession.id;
      } else {
        currentSessionId = newSessionId;
      }
    } else if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
    }

    sendEvent({
      type: 'session_init',
      sessionId: currentSessionId,
      userRole,
      userName
    });

    // 2. Persist user message to Supabase
    if (supabase) {
      try {
        await supabase.from('chat_messages').insert({
          id: crypto.randomUUID(),
          session_id: currentSessionId,
          role: 'user',
          content: message.trim(),
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.warn('[Chat Stream] Message insert warning:', err.message);
      }
    }

    // 3. Retrieve conversation history for context (last 8 messages)
    let historyMessages = [];
    if (supabase) {
      try {
        const { data: history } = await supabase
          .from('chat_messages')
          .select('role, content')
          .eq('session_id', currentSessionId)
          .order('created_at', { ascending: true })
          .limit(10);

        if (history && history.length > 0) {
          historyMessages = history.map(m => ({ role: m.role, content: m.content }));
        }
      } catch (hErr) {
        console.warn('[Chat Stream] History fetch warning:', hErr.message);
      }
    }

    if (historyMessages.length === 0) {
      historyMessages = [{ role: 'user', content: message.trim() }];
    }

    // 4. Construct prompt with real-time live data context and guardrails
    const systemPrompt = await getRoleSystemPrompt(userRole, userName, department);
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...historyMessages
    ];

    // Temperature adapts to role (more creative for student analogies, precise for deans/faculty)
    const temperature = userRole === 'STUDENT' ? 0.6 : 0.3;

    // 5. Stream from Groq Cloud API with model fallback
    const candidateModels = [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-120b',
      'groq/compound',
      'openai/gpt-oss-20b',
      'qwen/qwen3.6-27b',
      'llama-3.3-70b-versatile'
    ].filter(Boolean);

    let stream = null;
    let chosenModel = null;

    for (const modelName of candidateModels) {
      try {
        stream = await groq.chat.completions.create({
          model: modelName,
          messages: groqMessages,
          temperature,
          max_tokens: 2048,
          stream: true
        });
        chosenModel = modelName;
        break;
      } catch (mErr) {
        console.warn(`[Chat Stream] Model '${modelName}' unavailable: ${mErr.message}. Trying next candidate...`);
      }
    }

    if (!stream) {
      throw new Error('Unable to connect to any Groq AI model. Please check GROQ_API_KEY and model permissions.');
    }

    let fullAssistantResponse = '';

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        fullAssistantResponse += token;
        sendEvent({ type: 'token', content: token });
      }
    }

    // 6. Persist completed assistant answer
    if (fullAssistantResponse && supabase) {
      try {
        await supabase.from('chat_messages').insert({
          id: crypto.randomUUID(),
          session_id: currentSessionId,
          role: 'assistant',
          content: fullAssistantResponse,
          created_at: new Date().toISOString()
        });

        await supabase
          .from('chat_sessions')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', currentSessionId);
      } catch (pErr) {
        console.warn('[Chat Stream] Assistant message persistence warning:', pErr.message);
      }
    }

    sendEvent({ type: 'done', fullResponse: fullAssistantResponse });
    res.end();

  } catch (error) {
    console.error('[Chat Stream Controller Error]:', error);
    sendEvent({ type: 'error', error: error.message || 'Stream generation failed.' });
    res.end();
  }
}

/**
 * GET /api/ai/chat-sessions
 * List all sessions for the authenticated user
 */
export async function getChatSessions(req, res) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!supabase) {
      return res.json({ success: true, sessions: [] });
    }

    const { data: sessions, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, sessions: sessions || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/ai/chat-sessions/:sessionId/messages
 * Get message history for a specific session
 */
export async function getChatSessionMessages(req, res) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    if (!supabase) {
      return res.json({ success: true, messages: [] });
    }

    const { data: messages, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, messages: messages || [] });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * DELETE /api/ai/chat-sessions/:sessionId
 * Delete a session and its cascading messages
 */
export async function deleteChatSession(req, res) {
  try {
    const user = await resolveAuthenticatedUser(req);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { sessionId } = req.params;
    if (!supabase) {
      return res.json({ success: true });
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id);

    if (error) {
      return res.status(500).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Session deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
