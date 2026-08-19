import { generateChatGPTResponse } from '../services/advisorService.js';
import { supabase } from '../config/db.js';
import crypto from 'crypto';

export const handleAdvisorChat = async (req, res, next) => {
  try {
    const { userId, chatId: reqChatId, userQuestion } = req.body;

    if (!userQuestion || !userQuestion.trim()) {
      return res.status(400).json({
        success: false,
        error: 'userQuestion is required in request body.'
      });
    }

    const activeUserId = userId || 'prof-004';
    let currentChatId = reqChatId;

    // 1. If chatId is missing, create session in advisor_chats
    if (!currentChatId) {
      const chatTitle = userQuestion.length > 40 ? userQuestion.substring(0, 37) + '...' : userQuestion;
      const newId = crypto.randomUUID();

      const { data: newChat, error: chatErr } = await supabase
        .from('advisor_chats')
        .insert([{ id: newId, user_id: activeUserId, title: chatTitle }])
        .select()
        .single();

      if (chatErr) {
        console.error('[Advisor Controller] Supabase create chat error:', chatErr.message);
        return res.status(500).json({ success: false, error: chatErr.message });
      }
      currentChatId = newChat.id;
    }

    // 2. Insert user's question into advisor_messages
    const { error: userMsgErr } = await supabase
      .from('advisor_messages')
      .insert([{
        id: crypto.randomUUID(),
        chat_id: currentChatId,
        sender: 'user',
        message_text: userQuestion.trim()
      }]);

    if (userMsgErr) {
      console.error('[Advisor Controller] Save user message error:', userMsgErr.message);
      return res.status(500).json({ success: false, error: userMsgErr.message });
    }

    // 3. Retrieve past conversation history from advisor_messages
    const { data: historyData } = await supabase
      .from('advisor_messages')
      .select('sender, message_text')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true });

    const history = historyData || [];

    // 4. Generate AI response
    const aiResponseText = await generateChatGPTResponse(userQuestion.trim(), history);

    // 5. Save assistant message into advisor_messages
    const { error: assistantMsgErr } = await supabase
      .from('advisor_messages')
      .insert([{
        id: crypto.randomUUID(),
        chat_id: currentChatId,
        sender: 'assistant',
        message_text: aiResponseText
      }]);

    if (assistantMsgErr) {
      console.error('[Advisor Controller] Save assistant message error:', assistantMsgErr.message);
      return res.status(500).json({ success: false, error: assistantMsgErr.message });
    }

    // 6. Fetch full updated message log
    const { data: fullMsgs } = await supabase
      .from('advisor_messages')
      .select('*')
      .eq('chat_id', currentChatId)
      .order('created_at', { ascending: true });

    return res.status(200).json({
      success: true,
      chatId: currentChatId,
      aiResponse: aiResponseText,
      messages: fullMsgs || []
    });
  } catch (err) {
    next(err);
  }
};

export const getUserChats = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('advisor_chats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Advisor Controller] getUserChats error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, chats: data || [] });
  } catch (err) {
    next(err);
  }
};

export const getChatMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const { data, error } = await supabase
      .from('advisor_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Advisor Controller] getChatMessages error:', error.message);
      return res.status(500).json({ success: false, error: error.message });
    }

    return res.json({ success: true, messages: data || [] });
  } catch (err) {
    next(err);
  }
};
