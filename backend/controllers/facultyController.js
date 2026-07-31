import { mockStore } from '../services/mockStore.js';
import { groq, GROQ_MODEL } from '../config/groq.js';

export const getFaculty = async (req, res, next) => {
  try {
    const { department } = req.query;
    let facultyList = [...mockStore.faculty];

    if (department && department !== 'ALL') {
      facultyList = facultyList.filter(f => f.department === department);
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
    const totalFaculty = mockStore.faculty.length;
    const avgRating = (mockStore.faculty.reduce((acc, f) => acc + f.teaching_rating, 0) / totalFaculty).toFixed(2);
    const avgWorkload = (mockStore.faculty.reduce((acc, f) => acc + f.workload_hours, 0) / totalFaculty).toFixed(1);
    const overloadedCount = mockStore.faculty.filter(f => f.workload_hours > f.max_workload_hours).length;

    let aiSentimentSummary = 'Faculty members maintain high teaching satisfaction (4.7/5.0). Workload balance is optimal across 75% of staff, though Department Chairs require administrative offset due to advisory load.';

    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key') {
      try {
        const response = await groq.chat.completions.create({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: 'You are a university academic analyst.' },
            { role: 'user', content: `Synthesize faculty teaching ratings and workload distribution into a 2-sentence executive summary: ${JSON.stringify(mockStore.faculty)}` }
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
