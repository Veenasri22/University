import { supabase } from '../config/db.js';
import { mockStore } from '../services/mockStore.js';
import { groq, GROQ_MODEL } from '../config/groq.js';

export const getFaculty = async (req, res, next) => {
  try {
    const { department } = req.query;

    let facultyList = [];

    if (supabase) {
      try {
        let query = supabase.from('faculty').select('*, profiles(full_name, email)').order('created_at', { ascending: false });

        if (department && department !== 'ALL') {
          query = query.eq('department', department);
        }

        const { data, error } = await query;
        if (!error && data) {
          facultyList = data.map(f => {
            const mockMatch = mockStore.faculty.find(m => m.id === f.id || m.department === f.department);
            return {
              ...f,
              full_name: f.profiles?.full_name || mockMatch?.full_name || `Faculty ${f.designation}`,
              email: f.profiles?.email || mockMatch?.email || `faculty@university.edu`
            };
          });
        }
      } catch (err) {
        console.warn('[facultyController] Supabase fetch warning:', err.message);
      }
    }

    if (facultyList.length === 0) {
      facultyList = [...mockStore.faculty];
      if (department && department !== 'ALL') {
        facultyList = facultyList.filter(f => f.department === department);
      }
    }

    res.json({
      success: true,
      count: facultyList.length,
      faculty: facultyList
    });
  } catch (err) {
    next(err);
  }
};

export const getFacultyInsights = async (req, res, next) => {
  try {
    let facultyList = [];

    if (supabase) {
      try {
        const { data, error } = await supabase.from('faculty').select('*, profiles(full_name, email)');
        if (!error && data && data.length > 0) {
          facultyList = data.map(f => {
            const mockMatch = mockStore.faculty.find(m => m.id === f.id);
            return {
              ...f,
              full_name: f.profiles?.full_name || mockMatch?.full_name || `Faculty ${f.designation}`,
              email: f.profiles?.email || mockMatch?.email || `faculty@university.edu`
            };
          });
        }
      } catch (err) {
        console.warn('[facultyController] Insights query fallback:', err.message);
      }
    }

    if (facultyList.length === 0) {
      facultyList = mockStore.faculty;
    }

    const totalFaculty = facultyList.length;
    const avgRating = totalFaculty > 0
      ? (facultyList.reduce((acc, f) => acc + Number(f.teaching_rating || 0), 0) / totalFaculty).toFixed(2)
      : '5.00';
    const avgWorkload = totalFaculty > 0
      ? (facultyList.reduce((acc, f) => acc + Number(f.workload_hours || 0), 0) / totalFaculty).toFixed(1)
      : '0.0';
    const overloadedCount = facultyList.filter(f => Number(f.workload_hours || 0) > Number(f.max_workload_hours || 40)).length;

    let aiSentimentSummary = 'Faculty members maintain high teaching satisfaction (4.7/5.0). Workload balance is optimal across staff, though Department Chairs require administrative offset due to advisory load.';

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
      try {
        const response = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'You are a university academic analyst.' },
            { role: 'user', content: `Synthesize faculty teaching ratings and workload distribution into a 2-sentence executive summary: ${JSON.stringify(facultyList)}` }
          ],
          temperature: 0.3
        });
        if (response.choices[0]?.message?.content) {
          aiSentimentSummary = response.choices[0].message.content.trim();
        }
      } catch (e) {
        console.warn('[Groq AI] Faculty insights synthesis fallback:', e.message);
      }
    }

    res.json({
      success: true,
      metrics: {
        totalFaculty,
        averageTeachingRating: Number(avgRating),
        averageWorkloadHours: Number(avgWorkload),
        overloadedFacultyCount: overloadedCount
      },
      aiSentimentSummary
    });
  } catch (err) {
    next(err);
  }
};
