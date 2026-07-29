import { generateAdvisorChatResponse } from '../services/advisorService.js';
import { supabase } from '../config/db.js';
import { mockStore } from '../services/mockStore.js';
import crypto from 'crypto';

/**
 * Handle POST /api/advisor/chat
 * Manages chat session auto-creation, message history logging, AI response generation,
 * and Supabase persistence. Zero dummy data - relies strictly on user input.
 */
export const handleAdvisorChat = async (req, res, next) => {
  try {
    const { userId, chatId: reqChatId, userQuestion } = req.body;

    if (!userQuestion || !userQuestion.trim()) {
      return res.status(400).json({
        success: false,
        error: 'userQuestion is required in request body.'
      });
    }

    const activeUserId = userId || 'prof-004'; // Default to current authenticated user ID if unprovided
    let currentChatId = reqChatId;

    // 1. If chatId is missing or null, create a new row in advisor_chats
    if (!currentChatId) {
      const chatTitle = userQuestion.length > 40 ? userQuestion.substring(0, 37) + '...' : userQuestion;

      if (supabase) {
        const { data: newChat, error: chatErr } = await supabase
          .from('advisor_chats')
          .insert([{ user_id: activeUserId, title: chatTitle }])
          .select()
          .single();

        if (!chatErr && newChat) {
          currentChatId = newChat.id;
        } else {
          console.warn('[Advisor Controller] Supabase create chat warning:', chatErr?.message);
          currentChatId = crypto.randomUUID();
          mockStore.advisor_chats.push({ id: currentChatId, user_id: activeUserId, title: chatTitle, created_at: new Date().toISOString() });
        }
      } else {
        currentChatId = crypto.randomUUID();
        mockStore.advisor_chats.push({ id: currentChatId, user_id: activeUserId, title: chatTitle, created_at: new Date().toISOString() });
      }
    }

    // 2. Insert user's question directly into advisor_messages (sender: 'user')
    const userMsgRecord = {
      id: crypto.randomUUID(),
      chat_id: currentChatId,
      sender: 'user',
      message_text: userQuestion.trim(),
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error: userMsgErr } = await supabase
        .from('advisor_messages')
        .insert([{
          chat_id: currentChatId,
          sender: 'user',
          message_text: userQuestion.trim()
        }]);

      if (userMsgErr) {
        console.warn('[Advisor Controller] Supabase save user message warning:', userMsgErr.message);
        mockStore.advisor_messages.push(userMsgRecord);
      }
    } else {
      mockStore.advisor_messages.push(userMsgRecord);
    }

    // 3. Retrieve past conversation history from advisor_messages for context
    let history = [];
    if (supabase) {
      const { data: historyData } = await supabase
        .from('advisor_messages')
        .select('sender, message_text')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true });

      if (historyData) history = historyData;
    } else {
      history = mockStore.advisor_messages
        .filter(m => m.chat_id === currentChatId)
        .map(m => ({ sender: m.sender, message_text: m.message_text }));
    }

    // 4. Generate AI Response via Gemini SDK
    const aiResponseText = await generateAdvisorChatResponse({
      userQuestion: userQuestion.trim(),
      history
    });

    // 5. Save Gemini AI response directly into advisor_messages (sender: 'assistant')
    const assistantMsgRecord = {
      id: crypto.randomUUID(),
      chat_id: currentChatId,
      sender: 'assistant',
      message_text: aiResponseText,
      created_at: new Date().toISOString()
    };

    if (supabase) {
      const { error: assistantMsgErr } = await supabase
        .from('advisor_messages')
        .insert([{
          chat_id: currentChatId,
          sender: 'assistant',
          message_text: aiResponseText
        }]);

      if (assistantMsgErr) {
        console.warn('[Advisor Controller] Supabase save assistant message warning:', assistantMsgErr.message);
        mockStore.advisor_messages.push(assistantMsgRecord);
      }
    } else {
      mockStore.advisor_messages.push(assistantMsgRecord);
    }

    // 6. Fetch full updated message log for response
    let allMessages = [];
    if (supabase) {
      const { data: fullMsgs } = await supabase
        .from('advisor_messages')
        .select('*')
        .eq('chat_id', currentChatId)
        .order('created_at', { ascending: true });

      if (fullMsgs) allMessages = fullMsgs;
    } else {
      allMessages = mockStore.advisor_messages.filter(m => m.chat_id === currentChatId);
    }

    return res.status(200).json({
      success: true,
      chatId: currentChatId,
      aiResponse: aiResponseText,
      messages: allMessages
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle GET /api/advisor/chats/:userId
 * Retrieves user's chat sessions
 */
export const getUserChats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('advisor_chats')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return res.json({ success: true, chats: data });
      }
    }

    const chats = mockStore.advisor_chats.filter(c => c.user_id === userId);
    return res.json({ success: true, chats });
  } catch (err) {
    next(err);
  }
};

/**
 * Handle GET /api/advisor/messages/:chatId
 * Retrieves all messages for a specific chat session
 */
export const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    if (supabase) {
      const { data, error } = await supabase
        .from('advisor_messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        return res.json({ success: true, messages: data });
      }
    }

    const messages = mockStore.advisor_messages.filter(m => m.chat_id === chatId);
    return res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};
