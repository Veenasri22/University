# 🎓 University Academic Intelligence Platform

An enterprise-grade, multi-tenant AI-native academic intelligence ecosystem consolidating student performance, faculty governance, curriculum tracking, attendance analytics, and institutional planning using React, Express, Supabase PostgreSQL, Tailwind CSS, and Google Gemini API (`@google/genai` SDK).

## 🚀 Key Features

1. **Predictive Student Risk Evaluation**: ML-assisted Gemini evaluation of historical grades and attendance to forecast GPA trajectories and drop-out risks (`gemini-2.5-flash`).
2. **Multi-Agent Academic Advisor Network**: Specialized AI agents (Course Planner, Financial Aid, Career Pathway, General Advisor) with evidence-backed RAG policy citations.
3. **Enterprise Policy RAG Engine**: Retrieval-Augmented Generation over uploaded university handbooks and compliance documents.
4. **MCP (Model Context Protocol) Integration**: Google Calendar connector for scheduling advising appointments & Gmail connector for threshold alert warnings (<75% attendance).
5. **Accreditation & Executive Audit Generator**: One-click generation of structured JSON/PDF summaries for Chancellor, Deans, and accreditation boards.
6. **Core Modules**:
   - Executive Dashboard with KPI cards & Recharts trends.
   - Searchable Student Directory & Risk Badges.
   - Faculty Workload & Sentiment Analytics.
   - Curriculum & Syllabus Progress Trackers.
   - Class-level Attendance Logging.

## 🛠 Tech Stack

- **Frontend**: React.js (Vite), React Router v6, Tailwind CSS, Lucide React, Recharts.
- **Backend**: Express.js (ES Modules), Zod validation, JWT Authentication, Helmet, Rate Limiter.
- **Database**: PostgreSQL / Supabase with Row Level Security (RLS) & `vector` extension.
- **AI Engine**: `@google/genai` SDK using model `gemini-2.5-flash`.

## 📦 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` to access the application.
