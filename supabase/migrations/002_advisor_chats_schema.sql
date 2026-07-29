-- Migration 002: Interactive AI Academic Advisor Chat Tables

CREATE TABLE IF NOT EXISTS public.advisor_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.advisor_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES public.advisor_chats(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  message_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.advisor_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Public access to advisor_chats" ON public.advisor_chats;
CREATE POLICY "Public access to advisor_chats" ON public.advisor_chats FOR ALL USING (true);

DROP POLICY IF EXISTS "Public access to advisor_messages" ON public.advisor_messages;
CREATE POLICY "Public access to advisor_messages" ON public.advisor_messages FOR ALL USING (true);
