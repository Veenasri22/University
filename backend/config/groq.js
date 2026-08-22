import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key'
  ? process.env.GROQ_API_KEY
  : 'unconfigured_groq_api_key';

export const groq = new Groq({ apiKey });

// Default active Groq model
export const GROQ_MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

// Priority fallback list for Groq completions
export const GROQ_MODEL_CANDIDATES = [
  GROQ_MODEL,
  'openai/gpt-oss-120b',
  'groq/compound',
  'openai/gpt-oss-20b',
  'qwen/qwen3.6-27b',
  'llama-3.3-70b-versatile',
  'llama-3.1-8b-instant'
];
