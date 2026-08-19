import { supabase } from '../config/db.js';
import { groq, GROQ_MODEL } from '../config/groq.js';

export async function searchPolicies({ query, department }) {
  let results = [];

  const { data, error } = await supabase
    .from('policies')
    .select('*')
    .ilike('content', `%${query}%`);

  if (!error && data && data.length > 0) {
    results = data;
  } else {
    // If no exact ILIKE matches found, get top policies
    const { data: fallbackDocs } = await supabase
      .from('policies')
      .select('*')
      .limit(5);
    results = fallbackDocs || [];
  }

  // If Groq API is available, generate contextual answer over matched documents
  let aiAnswer = null;
  if (results.length > 0 && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
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

  if (!aiAnswer && results.length > 0) {
    const topDoc = results[0];
    aiAnswer = `According to **${topDoc.title}** (${topDoc.category}):\n\n"${topDoc.content}"\n\n*Citation: Section ${topDoc.id.toUpperCase()} - University Academic Code.*`;
  } else if (!aiAnswer) {
    aiAnswer = 'No policy document matching your query was found in the institution database.';
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

  const { data, error } = await supabase
    .from('policies')
    .insert([newPolicy])
    .select()
    .single();

  if (error) {
    console.error('[RAG Service] Supabase insert error:', error.message);
    throw new Error(error.message);
  }

  return data;
}
