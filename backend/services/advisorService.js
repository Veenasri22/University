import { ai, GEMINI_MODEL } from '../config/gemini.js';

/**
 * Service for Interactive AI Academic Advisor Chat powered by @google/genai SDK
 *
 * @param {Object} params
 * @param {string} params.userQuestion - Current question submitted by user
 * @param {Array<{ sender: string, message_text: string }>} [params.history] - Prior messages in this conversation
 * @returns {Promise<string>} AI Response text
 */
export const generateAdvisorChatResponse = async ({ userQuestion, history = [] }) => {
  const systemInstruction = `You are an empathetic, highly intelligent AI Academic Advisor. Answer the user's questions about academic planning, course selection, study strategies, and university guidance. Be concise, actionable, and encouraging.`;

  // Format past history context
  let historyContext = '';
  if (history && history.length > 0) {
    historyContext = 'Prior Conversation History:\n' +
      history.map(msg => `${msg.sender === 'user' ? 'User' : 'Academic Advisor'}: ${msg.message_text}`).join('\n') + '\n\n';
  }

  const prompt = `${historyContext}User Question: ${userQuestion}\n\nAcademic Advisor Response:`;

  if (ai) {
    try {
      console.log(`[Advisor Service] Generating chat response with ${GEMINI_MODEL}...`);
      
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction
        }
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.error('[Advisor Service Error] Gemini SDK generateContent failed:', err.message);
      console.log('[Advisor Service] Using intelligent advisor fallback model...');
    }
  }

  // Fallback intelligent advisor response engine when API key is unconfigured or offline
  return fallbackAdvisorResponse(userQuestion);
};

/**
 * Fallback response engine for local offline execution
 */
function fallbackAdvisorResponse(question) {
  const qLower = question.toLowerCase();

  if (qLower.includes('gpa') || qLower.includes('grade') || qLower.includes('score')) {
    return "Maintaining a strong GPA requires consistent review and early intervention. I recommend analyzing your current course weighting, scheduling weekly office hours with your professors, and utilizing peer tutoring for challenging modules. What specific subject is currently impacting your GPA?";
  }

  if (qLower.includes('course') || qLower.includes('subject') || qLower.includes('major') || qLower.includes('degree')) {
    return "Selecting the right courses is essential for staying on track towards graduation. I suggest reviewing your degree audit roadmap to ensure all prerequisite dependencies are met before registration. Would you like guidance on balancing high-workload technical courses with electives?";
  }

  if (qLower.includes('study') || qLower.includes('time') || qLower.includes('exam') || qLower.includes('test')) {
    return "Effective study strategies focus on active recall, spaced repetition, and time-boxing techniques like Pomodoro. Allocating 2 hours of self-study per credit hour each week is standard for academic success. How are you currently structuring your study schedule?";
  }

  return `Thank you for sharing your academic question regarding "${question}". As your AI Academic Advisor, I encourage you to set clear weekly goals, meet regularly with department mentors, and stay proactive with course milestone deadlines. Is there a specific goal you'd like to work towards this term?`;
}
