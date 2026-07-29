import { ai, GEMINI_MODEL } from '../config/gemini.js';

/**
 * AI Service for Academic Analysis & Advisory Generation
 * Utilizes @google/genai SDK with gemini-2.5-flash model and structured JSON output schema.
 *
 * @param {Object} params
 * @param {string} params.entityId - UUID of the entity (e.g. Student ID)
 * @param {Object|string} params.payload - Custom user academic data provided manually
 * @returns {Promise<{ riskLevel: string, summary: string, actionSteps: string[], followUpQuestions: string[] }>}
 */
export const generateAdvisory = async ({ entityId, payload }) => {
  const payloadStr = typeof payload === 'object' ? JSON.stringify(payload, null, 2) : String(payload);

  const prompt = `You are an expert Academic Advisor & Data Analyst AI operating within a University Intelligence System.
Analyze the following student/academic performance data submitted for Entity ID "${entityId}":

User Submitted Data/Payload:
${payloadStr}

Perform a rigorous evaluation and output an advisory response matching the required JSON schema with:
1. "riskLevel": Evaluated overall academic risk level ("LOW", "MEDIUM", or "HIGH").
2. "summary": A concise executive summary of the entity's status, key performance metrics, and identified risks.
3. "actionSteps": An array of 3-5 concrete, actionable academic intervention steps for the student or advisor.
4. "followUpQuestions": An array of 2-3 probing follow-up questions to investigate further.`;

  // Check if official SDK instance is initialized
  if (ai) {
    try {
      console.log(`[AI Service] Invoking ${GEMINI_MODEL} generateContent for Entity: ${entityId}`);

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              riskLevel: {
                type: 'STRING',
                enum: ['LOW', 'MEDIUM', 'HIGH']
              },
              summary: {
                type: 'STRING'
              },
              actionSteps: {
                type: 'ARRAY',
                items: {
                  type: 'STRING'
                }
              },
              followUpQuestions: {
                type: 'ARRAY',
                items: {
                  type: 'STRING'
                }
              }
            },
            required: ['riskLevel', 'summary', 'actionSteps', 'followUpQuestions']
          }
        }
      });

      const rawText = response.text;
      const parsedJSON = JSON.parse(rawText);

      return {
        riskLevel: parsedJSON.riskLevel || 'MEDIUM',
        summary: parsedJSON.summary || 'AI assessment completed successfully.',
        actionSteps: Array.isArray(parsedJSON.actionSteps) ? parsedJSON.actionSteps : [],
        followUpQuestions: Array.isArray(parsedJSON.followUpQuestions) ? parsedJSON.followUpQuestions : []
      };
    } catch (err) {
      console.error('[AI Service Error] Gemini SDK generateContent failed:', err.message);
      console.log('[AI Service] Falling back to intelligent heuristic evaluation engine...');
    }
  }

  // Fallback Heuristic Analysis Engine when API key is unconfigured or call fails
  return fallbackHeuristicAnalysis(entityId, payloadStr);
};

/**
 * Fallback Heuristic Analysis Engine for offline development / missing key mode
 */
function fallbackHeuristicAnalysis(entityId, payloadText) {
  const textLower = payloadText.toLowerCase();

  let riskLevel = 'LOW';
  if (textLower.includes('probation') || textLower.includes('fail') || textLower.includes('dip') || textLower.includes('struggling') || textLower.includes('gpa: 1') || textLower.includes('gpa: 2.0') || textLower.includes('attendance: 5') || textLower.includes('attendance: 6')) {
    riskLevel = 'HIGH';
  } else if (textLower.includes('warning') || textLower.includes('moderate') || textLower.includes('gpa: 2') || textLower.includes('attendance: 7')) {
    riskLevel = 'MEDIUM';
  }

  const summary = `Manual Assessment generated for Entity ${entityId}. Key signals analyzed: ${payloadText.length} characters of user data evaluated. Identified overall risk standing as ${riskLevel}.`;

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
