import { supabase } from '../config/db.js';
import { groq, GROQ_MODEL } from '../config/groq.js';
import crypto from 'crypto';

// In-memory fallback and seeded policies
const localPolicies = [
  {
    id: 'pol-01',
    title: 'Policy 4.2: Academic Probation & Retention Standards',
    category: 'Academic Standards',
    content: 'Students whose cumulative GPA falls below 2.0 or whose attendance rate drops below 75% are placed on Academic Warning. A mandatory academic recovery plan and bi-weekly advisor checkpoint must be scheduled.',
    created_at: new Date(Date.now() - 864000000).toISOString()
  },
  {
    id: 'pol-02',
    title: 'Policy 6.1: Course Repeat & Grade Forgiveness',
    category: 'Curriculum & Grading',
    content: 'An undergraduate student may repeat up to three (3) failed courses for grade forgiveness. The higher grade will replace the lower grade in cumulative GPA calculations.',
    created_at: new Date(Date.now() - 604800000).toISOString()
  },
  {
    id: 'pol-03',
    title: 'Policy 8.4: Faculty Syllabus & Assessment Compliance',
    category: 'Faculty Governance',
    content: 'All faculty members must publish finalized course syllabi, unit timelines, and assessment rubrics prior to the second week of instruction. Continuous internal evaluations must total 50% of the course grade.',
    created_at: new Date(Date.now() - 400000000).toISOString()
  },
  {
    id: 'pol-04',
    title: 'Policy 12.3: Satisfactory Academic Progress (SAP) & Title IV',
    category: 'Compliance & Aid',
    content: 'To maintain financial aid and institutional scholarship eligibility, students must complete at least 67% of attempted credit hours and maintain a minimum cumulative GPA of 2.0.',
    created_at: new Date(Date.now() - 200000000).toISOString()
  }
];

export async function searchPolicies({ query, department }) {
  let matchedDocs = [];

  if (supabase) {
    try {
      // Try searching 'policies' or 'academic_policies'
      const { data, error } = await supabase
        .from('policies')
        .select('*')
        .ilike('content', `%${query}%`);

      if (!error && Array.isArray(data) && data.length > 0) {
        matchedDocs = data;
      } else {
        const { data: fallbackDocs } = await supabase
          .from('policies')
          .select('*')
          .limit(6);

        if (fallbackDocs && fallbackDocs.length > 0) {
          matchedDocs = fallbackDocs;
        }
      }
    } catch (e) {
      console.warn('[RAG Service] Supabase search warning:', e.message);
    }
  }

  // Merge with local policies matching query keywords
  const queryLower = (query || '').toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 3);

  const localMatches = localPolicies.filter(p => {
    const pText = `${p.title} ${p.category} ${p.content}`.toLowerCase();
    return pText.includes(queryLower) || queryWords.some(w => pText.includes(w));
  });

  const existingIds = new Set(matchedDocs.map(d => d.id));
  const combined = [
    ...matchedDocs,
    ...localMatches.filter(d => !existingIds.has(d.id))
  ];

  const finalDocs = combined.length > 0 ? combined : localPolicies;

  // Generate contextual AI summary
  let aiAnswer = null;
  if (finalDocs.length > 0 && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
    const candidateModels = [GROQ_MODEL, 'openai/gpt-oss-120b', 'groq/compound', 'openai/gpt-oss-20b'];
    const contextText = finalDocs.slice(0, 4).map(r => `Document: ${r.title}\nCategory: ${r.category}\nContent: ${r.content}`).join('\n\n');

    for (const m of candidateModels) {
      try {
        const response = await groq.chat.completions.create({
          model: m,
          messages: [
            {
              role: 'system',
              content: 'You are the University Academic Policy RAG Specialist. Based strictly on the provided policy documents, answer the user query clearly with exact citations and structured bullet points.'
            },
            {
              role: 'user',
              content: `POLICY DOCUMENTS:\n${contextText}\n\nUSER QUERY: "${query}"`
            }
          ],
          temperature: 0.2
        });

        aiAnswer = response.choices[0]?.message?.content?.trim();
        if (aiAnswer) break;
      } catch (e) {
        // try next candidate
      }
    }
  }

  if (!aiAnswer && finalDocs.length > 0) {
    const topDoc = finalDocs[0];
    aiAnswer = `According to **${topDoc.title}** (${topDoc.category}):\n\n"${topDoc.content}"\n\n*Citation: Institutional Policy Codex.*`;
  } else if (!aiAnswer) {
    aiAnswer = 'No policy document matching your query was found in the institution database.';
  }

  return {
    query,
    results: finalDocs,
    matched_documents: finalDocs,
    ai_summary: aiAnswer
  };
}

export async function uploadPolicy({ title, category, content }) {
  const newPolicy = {
    id: `pol-${Date.now().toString().slice(-4)}`,
    title,
    category: category || 'Academic Standards',
    content,
    created_at: new Date().toISOString()
  };

  let savedDoc = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('policies')
        .insert([newPolicy])
        .select()
        .single();

      if (!error && data) {
        savedDoc = data;
      } else if (error) {
        console.warn('[RAG Service] Supabase insert warning (saving to local cache):', error.message);
      }
    } catch (e) {
      console.warn('[RAG Service] Supabase insert exception:', e.message);
    }
  }

  if (!savedDoc) {
    savedDoc = newPolicy;
  }

  // Always store in local policies list
  localPolicies.unshift(savedDoc);

  return savedDoc;
}
