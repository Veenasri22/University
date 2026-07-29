-- Migration 003: Dynamic Google Gemini AI Assistant Sessions & Chat Messages Tables

CREATE TABLE IF NOT EXISTS public.ai_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.ai_sessions(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.ai_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Public access to ai_sessions" ON public.ai_sessions;
CREATE POLICY "Public access to ai_sessions" ON public.ai_sessions FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access to ai_chat_messages" ON public.ai_chat_messages;
CREATE POLICY "Public access to ai_chat_messages" ON public.ai_chat_messages FOR ALL USING (true);
