import { supabase } from '../config/db.js';
import { groq, GROQ_MODEL } from '../config/groq.js';

export const getFaculty = async (req, res, next) => {
  try {
    const { department } = req.query;

    let query = supabase
      .from('faculty')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (department && department !== 'ALL') {
      query = query.eq('department', department);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[facultyController] Supabase fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const facultyList = (data || []).map(f => ({
      ...f,
      full_name: f.profiles?.full_name || f.full_name || `Faculty ${f.designation}`,
      email: f.profiles?.email || f.email || `faculty@university.edu`
    }));

    res.json({
      success: true,
      count: facultyList.length,
      faculty: facultyList
    });
  } catch (err) {
    next(err);
  }
};

export const createFaculty = async (req, res, next) => {
  try {
    const { full_name, email, department, designation, workload_hours, max_workload_hours, teaching_rating, research_publications, courses_taught } = req.body;

    if (!full_name || !department || !designation) {
      return res.status(400).json({ success: false, message: 'Full name, department, and designation are required.' });
    }

    let userId = null;
    const facultyEmail = email || `prof.${full_name.toLowerCase().replace(/\s+/g, '.')}@university.edu`;

    const { data: profile } = await supabase
      .from('profiles')
      .insert({
        email: facultyEmail,
        full_name,
        role: 'FACULTY',
        department
      })
      .select()
      .single();

    if (profile) userId = profile.id;

    const coursesArray = Array.isArray(courses_taught)
      ? courses_taught
      : (courses_taught ? String(courses_taught).split(',').map(c => c.trim()) : []);

    const newFacultyData = {
      id: `fac-${Date.now().toString().slice(-4)}`,
      ...(userId && { user_id: userId }),
      full_name,
      email: facultyEmail,
      department,
      designation,
      workload_hours: Number(workload_hours || 0),
      max_workload_hours: Number(max_workload_hours || 40),
      teaching_rating: Number(teaching_rating || 5.0),
      research_publications: Number(research_publications || 0),
      courses_taught: coursesArray
    };

    const { data, error } = await supabase
      .from('faculty')
      .insert(newFacultyData)
      .select('*, profiles(full_name, email)')
      .single();

    if (error) {
      console.error('[Supabase] Create faculty error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const createdFaculty = {
      ...data,
      full_name: data.profiles?.full_name || full_name,
      email: data.profiles?.email || facultyEmail
    };

    res.status(201).json({
      success: true,
      message: 'Faculty record created successfully in Supabase',
      faculty: createdFaculty
    });
  } catch (err) {
    next(err);
  }
};

export const getFacultyInsights = async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from('faculty')
      .select('*, profiles(full_name, email)');

    if (error) {
      console.error('[facultyController] Insights fetch error:', error.message);
      return res.status(500).json({ success: false, message: error.message });
    }

    const facultyList = (data || []).map(f => ({
      ...f,
      full_name: f.profiles?.full_name || f.full_name || `Faculty ${f.designation}`,
      email: f.profiles?.email || f.email || `faculty@university.edu`
    }));

    const totalFaculty = facultyList.length;
    const avgRating = totalFaculty > 0
      ? (facultyList.reduce((acc, f) => acc + Number(f.teaching_rating || 0), 0) / totalFaculty).toFixed(2)
      : '0.00';
    const avgWorkload = totalFaculty > 0
      ? (facultyList.reduce((acc, f) => acc + Number(f.workload_hours || 0), 0) / totalFaculty).toFixed(1)
      : '0.0';
    const overloadedCount = facultyList.filter(f => Number(f.workload_hours || 0) > Number(f.max_workload_hours || 40)).length;

    let aiSentimentSummary = totalFaculty > 0
      ? 'Faculty members maintain high teaching satisfaction and balanced workload distribution across departments.'
      : 'No faculty members enrolled yet. Add your institution faculty to generate real-time AI performance summaries.';

    if (totalFaculty > 0 && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
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
