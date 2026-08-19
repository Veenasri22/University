import crypto from 'crypto';
import { supabase } from '../config/db.js';

export async function logAuditEvent({ actorId, actorName, action, targetEntity, details = {}, ipAddress = '127.0.0.1' }) {
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

  const { error } = await supabase.from('audit_logs').insert([logEntry]);
  if (error) {
    console.error('[AuditService] Supabase insert error:', error.message);
  } else {
    console.log(`[Audit] [${logEntry.action}] by ${logEntry.actor_name} on ${logEntry.target_entity}`);
  }
  return logEntry;
}

export async function getAuditLogs(limit = 50) {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[AuditService] Fetch from Supabase failed:', error.message);
    return [];
  }
  return data || [];
}
