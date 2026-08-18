import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import facultyRoutes from './routes/facultyRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import advisorRoutes from './routes/advisorRoutes.js';
import trackerRoutes from './routes/trackerRoutes.js';

import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import { handleGenerateAdvisory, handleAskAi } from './controllers/aiController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust first proxy hop
app.set('trust proxy', 1);

// Security & Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Global Rate Limiting
app.use('/api/', apiLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'University Academic Intelligence Platform API',
    groqConfigured: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key'),
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.post('/api/generate-advisory', handleGenerateAdvisory);
app.post('/api/ask', handleAskAi);
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/advisor', advisorRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/tracker', trackerRoutes);

// Centralized Error Handling
app.use(errorHandler);

import { seedDatabase } from './scripts/seed.js';

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🎓 University Academic Intelligence Backend Server`);
  console.log(`🚀 Running on: http://localhost:${PORT}`);
  console.log(`====================================================`);
  seedDatabase().catch(err => console.warn('[Seed] Async seed error:', err.message));
});
