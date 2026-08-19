/**
 * DEPRECATED: mockStore has been fully migrated to Supabase PostgreSQL database persistence.
 * All state management and CRUD operations are now handled directly via Supabase.
 */

export const mockStore = {
  profiles: [],
  students: [],
  faculty: [],
  courses: [],
  attendance_logs: [],
  assessments: [],
  policies: [],
  advisory_records: [],
  ai_academic_reports: [],
  audit_logs: [],
  student_attendance: [],
  course_syllabus: [],
  ai_generated_advisories: [],
  advisor_chats: [],
  advisor_messages: [],
  ai_sessions: [],
  ai_chat_messages: []
};

console.warn('[Deprecation Warning] mockStore is deprecated. All state is persisted to Supabase PostgreSQL.');
