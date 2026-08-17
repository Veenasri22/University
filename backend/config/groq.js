import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key'
  ? process.env.GROQ_API_KEY
  : 'unconfigured_groq_api_key';

export const groq = new Groq({ apiKey });

export const GROQ_MODEL = process.env.GROQ_MODEL || 'groq/compound';
