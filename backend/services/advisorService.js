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

  // 2. Direct API call to Groq
  const response = await groq.chat.completions.create({
    model: GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.3,
    max_tokens: 1000
  });

  const aiOutput = response?.choices?.[0]?.message?.content;

  if (!aiOutput) {
    throw new Error('Groq API returned an empty response.');
  }

  console.log('[Advisor Service] Live response generated successfully from Groq!');
  return aiOutput.trim();
};

// Aliases so existing controller imports don't break
export const generateChatGPTResponse = generateGroqResponse;
export const generateAdvisorChatResponse = async ({ userQuestion, history = [] }) => {
  return generateGroqResponse(userQuestion, history);
};