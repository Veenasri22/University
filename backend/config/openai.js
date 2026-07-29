import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

let openaiInstance = null;

if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
  try {
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    console.log('[OpenAI SDK] Initialized successfully with OPENAI_API_KEY.');
  } catch (err) {
    console.warn('[OpenAI SDK] Initialization warning:', err.message);
  }
} else {
  console.warn('[OpenAI SDK] OPENAI_API_KEY is missing or unconfigured. AI calls will use local fallback model until configured.');
}

export const openai = openaiInstance;
export const CHAT_MODEL = 'gpt-4o-mini';
