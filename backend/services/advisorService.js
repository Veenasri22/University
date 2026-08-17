import { groq, GROQ_MODEL } from '../config/groq.js';

/**
 * Service for Interactive AI Academic Advisor Chat using Groq SDK.
 * Model: llama-3.3-70b-versatile, Temperature: 0.3
 *
 * @param {string} userQuestion - Question submitted by user
 * @param {Array<{ sender: string, message_text: string }>} [conversationHistory] - Past messages in session
 * @returns {Promise<string>} Live AI response from Groq
 */
export const generateGroqResponse = async (userQuestion, conversationHistory = []) => {
  const systemPrompt = "You are an empathetic, expert AI Academic Advisor. Provide clear, accurate, and direct answers to user questions.";

  // 1. Format past conversation history for Groq API
  const formattedHistory = (conversationHistory || []).slice(-10).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.message_text
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: userQuestion }
  ];

  console.log(`[Advisor Service] Sending request to Groq API (${GROQ_MODEL || 'llama-3.3-70b-versatile'})...`);

  try {
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL || 'qwen/qwen3.6-27b',
      messages,
      temperature: 0.3,
      max_tokens: 1000
    });

    let aiOutput = response?.choices?.[0]?.message?.content || '';
    aiOutput = aiOutput.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    if (!aiOutput) {
      return "I'm here to assist with your academic journey. Could you please rephrase your question?";
    }

    console.log('[Advisor Service] Live response generated successfully from Groq!');
    return aiOutput;
  } catch (err) {
    console.error('[Advisor Service Error]', err.message);
    return `Regarding "${userQuestion}": Thank you for your inquiry. Please consult with your department academic advisor for specific guidance or check the university course catalog for degree requirements.`;
  }
};

// Aliases so existing controller imports don't break
export const generateChatGPTResponse = generateGroqResponse;
export const generateAdvisorChatResponse = async ({ userQuestion, history = [] }) => {
  return generateGroqResponse(userQuestion, history);
};