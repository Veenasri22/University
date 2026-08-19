/**
 * Production TypeScript Database Types & Update Service Contracts
 * University Academic Intelligence Platform
 */

export type UserRole = 'SUPER_ADMIN' | 'DEAN' | 'HOD' | 'FACULTY' | 'ACADEMIC_ADVISOR' | 'STUDENT';
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type AcademicStatus = 'ACTIVE' | 'PROBATION' | 'SUSPENDED' | 'GRADUATED';

// ─── DATABASE ROW TYPES ──────────────────────────────────────────────────────

export interface ProfileRow {
  id: string;
  email: string;
  password_hash?: string;
  full_name: string;
  role: UserRole;
  department: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserPreferencesRow {
  id: string;
  user_id: string;
  attendance_warnings: boolean;
  risk_escalations: boolean;
  weekly_digest: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentRow {
  id: string;
  user_id: string | null;
  student_code: string;
  full_name: string;
  email: string | null;
  department: string;
  program: string;
  semester: number;
  enrollment_year: number;
  current_gpa: number;
  attendance_rate: number;
  credits_earned: number;
  credits_required: number;
  predicted_risk: RiskLevel;
  status: AcademicStatus;
  advisor_notes: string | null;
  gpa_history: Array<{ term: string; gpa: number }>;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ─── PARTIAL / UPDATE PAYLOAD TYPES (DIRTY FIELDS) ──────────────────────────

export type ProfileUpdatePayload = Partial<Omit<ProfileRow, 'id' | 'created_at' | 'updated_at'>>;

export type UserPreferencesUpdatePayload = Partial<Omit<UserPreferencesRow, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

export type StudentUpdatePayload = Partial<Omit<StudentRow, 'id' | 'created_at' | 'updated_at'>>;

// ─── SERVICE RESPONSE CONTRACT ───────────────────────────────────────────────

export interface ParsedSupabaseError {
  message: string;
  code: string | null;
  details: string | null;
  hint: string | null;
}

export interface ServiceResponse<T> {
  success: boolean;
  data: T | null;
  error: ParsedSupabaseError | null;
  dirtyFields: string[];
}
