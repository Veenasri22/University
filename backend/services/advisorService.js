import { openai, CHAT_MODEL } from '../config/openai.js';

/**
 * Service for Interactive AI Academic Advisor Chat powered directly by OpenAI ChatGPT (gpt-4o-mini).
 * Completely removes document vector search / Policy RAG lookups.
 *
 * @param {string} userQuestion - Question submitted by user
 * @param {Array<{ sender: string, message_text: string }>} [conversationHistory] - Past messages in session
 * @returns {Promise<string>} ChatGPT Response text
 */
export const generateChatGPTResponse = async (userQuestion, conversationHistory = []) => {
  const systemPrompt = `You are an empathetic, highly intelligent AI Academic Advisor. Answer the user's questions about academic planning, course selection, study strategies, and university guidance directly, concisely, and encouragingly.`;

  // Build OpenAI chat completions messages array
  const formattedHistory = (conversationHistory || []).map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.message_text
  }));

  const messages = [
    { role: 'system', content: systemPrompt },
    ...formattedHistory,
    { role: 'user', content: userQuestion }
  ];

  if (openai) {
    try {
      console.log(`[ChatGPT Advisor Service] Invoking OpenAI ${CHAT_MODEL} chat completion...`);

      const response = await openai.chat.completions.create({
        model: CHAT_MODEL,
        messages: messages,
        temperature: 0.7,
        max_tokens: 800
      });

      if (response && response.choices && response.choices.length > 0) {
        return response.choices[0].message.content.trim();
      }
    } catch (err) {
      console.error('[ChatGPT Advisor Service Error] OpenAI API call failed:', err.message);
      console.log('[ChatGPT Advisor Service] Falling back to intelligent response generator...');
    }
  }

  // Fallback intelligent response generator for unconfigured OPENAI_API_KEY or API error
  return fallbackChatGPTResponse(userQuestion);
};

// Backwards compatibility alias
export const generateAdvisorChatResponse = async ({ userQuestion, history = [] }) => {
  return generateChatGPTResponse(userQuestion, history);
};

/**
 * Fallback response engine for local offline execution
 */
function fallbackChatGPTResponse(question) {
  const qLower = question.toLowerCase();

  if (qLower.includes('gpa') || qLower.includes('grade') || qLower.includes('score')) {
    return "Maintaining a strong GPA requires consistent review and early intervention. I recommend analyzing your current course weighting, scheduling weekly office hours with your professors, and utilizing peer tutoring for challenging modules. What specific subject is currently impacting your academic standing?";
  }

  if (qLower.includes('course') || qLower.includes('subject') || qLower.includes('major') || qLower.includes('degree')) {
    return "Selecting the right courses is essential for staying on track towards graduation. I suggest reviewing your degree audit roadmap to ensure all prerequisite dependencies are met before registration. Would you like guidance on balancing high-workload technical courses with electives?";
  }

  if (qLower.includes('study') || qLower.includes('time') || qLower.includes('exam') || qLower.includes('test')) {
    return "Effective study strategies focus on active recall, spaced repetition, and time-boxing techniques like Pomodoro. Allocating 2 hours of self-study per credit hour each week is standard for academic success. How are you currently structuring your study schedule?";
  }

  return `Thank you for reaching out regarding "${question}". As your AI Academic Advisor, I encourage you to set clear weekly goals, meet regularly with department mentors, and stay proactive with course milestone deadlines. Is there a specific goal you'd like to work towards this term?`;
}
