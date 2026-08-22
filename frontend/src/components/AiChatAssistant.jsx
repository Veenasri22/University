import React from 'react';
import RoleChatDrawer from './RoleChatDrawer.jsx';

/**
 * AiChatAssistant Component
 * High-performance, role-aware AI Chat powered by Groq Llama-3.3-70B and Supabase.
 */
export const AiChatAssistant = () => {
  return <RoleChatDrawer embedded={true} />;
};

export default AiChatAssistant;
