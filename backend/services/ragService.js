import { mockStore } from './mockStore.js';
import { supabase } from '../config/db.js';
import { groq, GROQ_MODEL } from '../config/groq.js';

export async function searchPolicies({ query, department }) {
  // If Supabase text search is available
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('academic_policies')
        .select('*')
        .ilike('content', `%${query}%`);
      
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (e) {
      console.warn('[RAG Service] Supabase query fallback:', e.message);
    }
  }

  // Smart local RAG fallback matching keywords
  const terms = query.toLowerCase().split(' ').filter(t => t.length > 2);
  const matched = mockStore.policies.filter(pol => {
    const text = (pol.title + ' ' + pol.category + ' ' + pol.content).toLowerCase();
    return terms.some(term => text.includes(term));
  });

  const results = matched.length > 0 ? matched : mockStore.policies.slice(0, 2);

  // If Groq API is available, generate contextual answer over matched documents
  let aiAnswer = null;
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    try {
      const contextText = results.map(r => `Document: ${r.title}\nCategory: ${r.category}\nContent: ${r.content}`).join('\n\n');
      const response = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: 'You are an academic policy expert RAG system. Based strictly on the provided policy documents, answer the user query clearly with exact citations.' },
          { role: 'user', content: `POLICY DOCUMENTS:\n${contextText}\n\nUSER QUERY: "${query}"` }
        ],
        temperature: 0.3
      });
      aiAnswer = response.choices[0]?.message?.content?.trim();
    } catch (e) {
      console.error('[Groq API] RAG Answer generation failed:', e.message);
    }
  }

  if (!aiAnswer) {
    const topDoc = results[0];
    aiAnswer = `According to **${topDoc.title}** (${topDoc.category}):\n\n"${topDoc.content}"\n\n*Citation: Section ${topDoc.id.toUpperCase()} - University Academic Code.*`;
  }

  return {
    query,
    matched_documents: results,
    ai_summary: aiAnswer
  };
}

export async function uploadPolicy({ title, category, content }) {
  const newPolicy = {
    id: `pol-${Date.now().toString().slice(-4)}`,
    title,
    category,
    content,
    created_at: new Date().toISOString()
  };

  if (supabase) {
    try {
      await supabase.from('academic_policies').insert([newPolicy]);
    } catch (e) {
      console.warn('[RAG Service] Supabase insert warning:', e.message);
    }
  }

  mockStore.policies.unshift(newPolicy);
  return newPolicy;
}
