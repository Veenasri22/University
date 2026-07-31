import { groq, GROQ_MODEL } from '../config/groq.js';

/**
 * Service for Interactive AI Academic Advisor Chat using Groq SDK.
 * Model: llama-3.3-70b-versatile, Temperature: 0.3
 *
 * @param {string} userQuestion - Question submitted by user
 * @param {Array<{ sender: string, message_text: string }>} [conversationHistory] - Past messages in session
 * @returns {Promise<string>} Response text
 */
export const generateChatGPTResponse = async (userQuestion, conversationHistory = []) => {
  const systemPrompt = "You are an empathetic, expert AI Academic Advisor. Provide clear, accurate, and direct answers to user questions.";

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      console.log(`[Advisor Service] Invoking Groq ${GROQ_MODEL} chat completion...`);

      const formattedHistory = (conversationHistory || []).slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.message_text
      }));

      const messages = [
        { role: 'system', content: systemPrompt },
        ...formattedHistory,
        { role: 'user', content: userQuestion }
      ];

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1000
      });

      if (response && response.choices && response.choices.length > 0) {
        return response.choices[0].message.content.trim();
      }
    } catch (err) {
      console.error('[Advisor Service Error] Groq API failed:', err.message);
    }
  }

  // Local fallback engine when API key is unconfigured or call fails
  return fallbackChatGPTResponse(userQuestion);
};

// Backwards compatibility alias
export const generateAdvisorChatResponse = async ({ userQuestion, history = [] }) => {
  return generateChatGPTResponse(userQuestion, history);
};

/**
 * General-purpose conversational fallback engine.
 * Used only when Groq API key is unconfigured or network call fails.
 */
function fallbackChatGPTResponse(question) {
  const p = (question || '').trim();
  const pL = p.toLowerCase();

  // Greetings
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy)([\s!,]|$)/i.test(pL)) {
    return `Hello! I'm your AI Academic Advisor. I can help with course selection, degree planning, academic policy guidance, study techniques, or performance tracking. How can I assist you today?`;
  }

  // Academic: GPA / grades
  if (pL.includes('gpa') || pL.includes('grade') || pL.includes('score') || pL.includes('marks')) {
    return `**GPA & Academic Standing Guidelines:**
- **Standard Scale**: A = 4.0, B = 3.0, C = 2.0, D = 1.0, F = 0.0
- **Good Standing**: Cumulative GPA ≥ 2.00
- **Academic Recovery**: Students below 2.00 should complete a tutoring contract and schedule weekly advisor check-ins.`;
  }

  // Academic: Attendance / Syllabus
  if (pL.includes('attendance') || pL.includes('syllabus') || pL.includes('tracker')) {
    return `**Academic Tracker Overview:**
- Use the **Performance & Syllabus Tracker** tab to monitor attendance trends and course module coverage.
- Attendance below 75% triggers mandatory institutional early-warning advising.`;
  }

  return `Thank you for reaching out regarding "${p}". As your AI Academic Advisor, I recommend scheduling a follow-up session with your department advisor or checking the Performance & Syllabus Tracker for detailed progress updates.`;
}
