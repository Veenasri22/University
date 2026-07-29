import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

let aiInstance = null;

if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_google_gemini_api_key') {
  try {
    aiInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    console.log('[Gemini SDK] Initialized successfully with GEMINI_API_KEY.');
  } catch (err) {
    console.warn('[Gemini SDK] Initialization warning:', err.message);
  }
} else {
  console.warn('[Gemini SDK] GEMINI_API_KEY is missing or unconfigured. AI calls will use local fallback heuristic model until configured.');
}

export const ai = aiInstance;
export const GEMINI_MODEL = 'gemini-2.5-flash';
