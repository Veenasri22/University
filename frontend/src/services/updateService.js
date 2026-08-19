import { supabase } from './supabaseClient.js';
import api from './api.js';

/**
 * Compares original record with updated form state to isolate dirty/modified fields.
 * Prevents redundant column writes and payload bloat.
 * 
 * @param {Object} original - Unmodified snapshot fetched from database
 * @param {Object} current - Modified form state submitted by user
 * @returns {{ dirtyPayload: Object, dirtyFields: string[] }}
 */
export function getDirtyFields(original = {}, current = {}) {
  const dirtyPayload = {};
  const dirtyFields = [];

  if (!original || typeof original !== 'object') {
    return { dirtyPayload: current, dirtyFields: Object.keys(current) };
  }

  for (const key of Object.keys(current)) {
    // Skip internal or system metadata fields
    if (['id', 'created_at', 'updated_at'].includes(key)) continue;

    const originalVal = original[key];
    const currentVal = current[key];

    // Deep compare objects/arrays or standard equality for primitives
    const isDifferent = typeof currentVal === 'object' && currentVal !== null
      ? JSON.stringify(originalVal) !== JSON.stringify(currentVal)
      : originalVal !== currentVal;

    if (isDifferent) {
      dirtyPayload[key] = currentVal;
      dirtyFields.push(key);
    }
  }

  return { dirtyPayload, dirtyFields };
}

/**
 * Standardizes Supabase error parsing into actionable objects.
 * 
 * @param {Object} error - Supabase client error response
 * @returns {{ message: string, code: string|null, details: string|null, hint: string|null }}
 */
export function parseSupabaseError(error) {
  if (!error) return null;
  return {
    message: error.message || 'An unexpected error occurred during database update.',
    code: error.code || null,
    details: error.details || null,
    hint: error.hint || null
  };
}

/**
 * Updates a User Profile record by ID with dirty-field sanitization.
 * 
 * @param {string} userId - Target user UUID or profile string ID
 * @param {Object} currentData - Proposed form state
 * @param {Object} [originalData] - Baseline profile snapshot
 * @returns {Promise<{ success: boolean, data: Object|null, error: Object|null, dirtyFields: string[] }>}
 */
export async function updateProfile(userId, currentData, originalData = {}) {
  const { dirtyPayload, dirtyFields } = getDirtyFields(originalData, currentData);

  if (dirtyFields.length === 0) {
    return {
      success: true,
      data: originalData,
      error: null,
      dirtyFields: []
    };
  }

  try {
    // Direct Supabase update attempt
    const { data, error } = await supabase
      .from('profiles')
      .update(dirtyPayload)
      .eq('id', userId)
      .select()
      .maybeSingle();

    if (!error && data) {
      return {
        success: true,
        data,
        error: null,
        dirtyFields
      };
    }

    // Fallback via Express API endpoint if direct client RLS restricts update
    const apiRes = await api.patch(`/auth/profile`, dirtyPayload);
    if (apiRes && apiRes.success) {
      return {
        success: true,
        data: apiRes.user || { ...originalData, ...dirtyPayload },
        error: null,
        dirtyFields
      };
    }

    if (error) {
      return {
        success: false,
        data: null,
        error: parseSupabaseError(error),
        dirtyFields
      };
    }

    return {
      success: true,
      data: { ...originalData, ...dirtyPayload },
      error: null,
      dirtyFields
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: {
        message: err.message || 'Failed to update profile record.',
        code: 'CLIENT_ERROR',
        details: null,
        hint: null
      },
      dirtyFields
    };
  }
}

/**
 * Updates or creates User Notification Preferences in Supabase.
 * 
 * @param {string} userId - Target user ID
 * @param {Object} currentPrefs - Updated preference settings
 * @param {Object} [originalPrefs] - Baseline preferences
 * @returns {Promise<{ success: boolean, data: Object|null, error: Object|null, dirtyFields: string[] }>}
 */
export async function updateUserPreferences(userId, currentPrefs, originalPrefs = {}) {
  const { dirtyPayload, dirtyFields } = getDirtyFields(originalPrefs, currentPrefs);

  if (dirtyFields.length === 0) {
    return {
      success: true,
      data: originalPrefs,
      error: null,
      dirtyFields: []
    };
  }

  try {
    const payload = {
      user_id: userId,
      ...currentPrefs,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) {
      return {
        success: false,
        data: null,
        error: parseSupabaseError(error),
        dirtyFields
      };
    }

    return {
      success: true,
      data,
      error: null,
      dirtyFields
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: {
        message: err.message || 'Failed to persist user preferences.',
        code: 'CLIENT_ERROR',
        details: null,
        hint: null
      },
      dirtyFields
    };
  }
}

/**
 * Updates Student Performance Metrics with dirty-field extraction.
 * 
 * @param {string} studentId - Student record ID
 * @param {Object} currentData - Updated performance fields
 * @param {Object} [originalData] - Original student record
 * @returns {Promise<{ success: boolean, data: Object|null, error: Object|null, dirtyFields: string[] }>}
 */
export async function updateStudentMetrics(studentId, currentData, originalData = {}) {
  const { dirtyPayload, dirtyFields } = getDirtyFields(originalData, currentData);

  if (dirtyFields.length === 0) {
    return {
      success: true,
      data: originalData,
      error: null,
      dirtyFields: []
    };
  }

  try {
    const res = await api.patch(`/students/${studentId}/performance`, dirtyPayload);
    return {
      success: true,
      data: res.student || res,
      error: null,
      dirtyFields
    };
  } catch (err) {
    return {
      success: false,
      data: null,
      error: {
        message: err.message || 'Failed to update student metrics.',
        code: 'STUDENT_UPDATE_ERROR',
        details: null,
        hint: null
      },
      dirtyFields
    };
  }
}
