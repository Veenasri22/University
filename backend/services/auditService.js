import { mockStore } from './mockStore.js';
import crypto from 'crypto';

/**
 * Audit Service — logs all significant system actions to the audit_logs store.
 * Writes to Supabase if available, otherwise falls back to in-memory mockStore.
 *
 * @param {object} params
 * @param {string}  params.actorId     - ID of the user performing the action
 * @param {string}  params.actorName   - Display name of the actor
 * @param {string}  params.action      - Action key (e.g. 'LOGIN', 'AI_REPORT_GENERATED')
 * @param {string}  params.targetEntity - Table / entity being affected
 * @param {object}  [params.details]   - Additional JSON payload about the action
 * @param {string}  [params.ipAddress] - Request IP address
 * @param {object}  [params.supabase]  - Optional live Supabase client reference
 */
export async function logAuditEvent({ actorId, actorName, action, targetEntity, details = {}, ipAddress = '127.0.0.1', supabase = null }) {
  const logEntry = {
    id: `aud-${crypto.randomUUID().slice(0, 8)}`,
    actor_id: actorId || null,
    actor_name: actorName || 'System',
    action: action.toUpperCase(),
    target_entity: targetEntity,
    details,
    ip_address: ipAddress,
    created_at: new Date().toISOString()
  };

  // Try Supabase first
  if (supabase) {
    try {
      const { error } = await supabase.from('audit_logs').insert([{
        actor_id: logEntry.actor_id,
        action: logEntry.action,
        target_entity: logEntry.target_entity,
        details: logEntry.details,
        ip_address: logEntry.ip_address
      }]);
      if (!error) {
        console.log(`[Audit] [${logEntry.action}] by ${logEntry.actor_name} on ${logEntry.target_entity}`);
        return logEntry;
      }
      console.warn('[AuditService] Supabase insert warning, using in-memory fallback');
    } catch (err) {
      console.warn('[AuditService] Supabase error:', err.message);
    }
  }

  // Fallback to in-memory
  mockStore.audit_logs.push(logEntry);
  console.log(`[Audit] [${logEntry.action}] by ${logEntry.actor_name} on ${logEntry.target_entity}`);
  return logEntry;
}

/**
 * Retrieves the most recent audit log entries (newest first).
 * @param {number} limit - Max number of records to return
 * @param {object} supabase - Optional Supabase client
 * @returns {Promise<Array>} Array of audit log entries
 */
export async function getAuditLogs(limit = 50, supabase = null) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    } catch (err) {
      console.warn('[AuditService] Fetch from Supabase failed:', err.message);
    }
  }

  return [...mockStore.audit_logs]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, limit);
}
