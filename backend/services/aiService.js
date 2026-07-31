import { groq, GROQ_MODEL } from '../config/groq.js';

/**
 * AI Service for Academic Analysis & Advisory Generation using Groq SDK.
 * Model: llama-3.3-70b-versatile
 *
 * @param {Object} params
 * @param {string} params.entityId - UUID of the entity (e.g. Student ID)
 * @param {Object|string} params.payload - Custom user academic data provided manually
 * @returns {Promise<{ riskLevel: string, summary: string, actionSteps: string[], followUpQuestions: string[] }>}
 */
export const generateAdvisory = async ({ entityId, payload }) => {
  const payloadStr = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : String(payload);

  const systemPrompt = `You are an expert Academic Advisor & Data Analyst AI operating within a University Intelligence System.
Analyze the provided student/academic performance data and output strictly a JSON object with:
- "riskLevel": ("LOW", "MEDIUM", or "HIGH")
- "summary": (concise executive summary)
- "actionSteps": (array of 3-5 concrete action steps)
- "followUpQuestions": (array of 2-3 probing follow-up questions)

Return ONLY valid JSON matching this schema, with no markdown formatting around it if possible.`;

  const userPrompt = `Entity ID: "${entityId}"\nData Payload:\n${payloadStr}`;

  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      console.log(`[AI Service] Invoking Groq ${GROQ_MODEL} for Entity: ${entityId}`);

      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3
      });

      const rawText = response.choices[0]?.message?.content || '{}';
      const parsedJSON = JSON.parse(rawText);

      return {
        riskLevel: parsedJSON.riskLevel || 'MEDIUM',
        summary: parsedJSON.summary || 'AI assessment completed successfully.',
        actionSteps: Array.isArray(parsedJSON.actionSteps) ? parsedJSON.actionSteps : [],
        followUpQuestions: Array.isArray(parsedJSON.followUpQuestions) ? parsedJSON.followUpQuestions : []
      };
    } catch (err) {
      console.error('[AI Service Error] Groq API failed:', err.message);
      console.log('[AI Service] Falling back to intelligent heuristic evaluation engine...');
    }
  }

  return fallbackHeuristicAnalysis(entityId, payloadStr);
};

function fallbackHeuristicAnalysis(entityId, payloadText) {
  const textLower = payloadText.toLowerCase();

  let riskLevel = 'LOW';
  if (textLower.includes('probation') || textLower.includes('fail') || textLower.includes('struggling') || textLower.includes('gpa: 1') || textLower.includes('gpa: 2.0') || textLower.includes('attendance: 5') || textLower.includes('attendance: 6')) {
    riskLevel = 'HIGH';
  } else if (textLower.includes('warning') || textLower.includes('moderate') || textLower.includes('gpa: 2') || textLower.includes('attendance: 7')) {
    riskLevel = 'MEDIUM';
  }

  const summary = `Assessment generated for Entity ${entityId}. Key signals analyzed from user payload. Overall risk standing evaluated as ${riskLevel}.`;

  const actionSteps = [
    `Schedule an immediate academic advising session for entity ${entityId}.`,
    `Review historical course scores and attendance logs for trends.`,
    `Establish a weekly progress monitoring checkpoint with department leads.`
  ];

  if (riskLevel === 'HIGH') {
    actionSteps.push('Enroll student in mandatory peer tutoring and academic recovery program.');
  }

  const followUpQuestions = [
    'What external or personal factors might be impacting academic performance?',
    'Has the student utilized department office hours and tutoring resources?',
    'Would a reduced course load or course repeat option improve academic standing?'
  ];

  return {
    riskLevel,
    summary,
    actionSteps,
    followUpQuestions
  };
}
