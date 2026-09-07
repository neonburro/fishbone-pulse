import { supabase } from '../lib/supabase'

let actor = null

/** Called by AuthProvider so log rows carry the profile display name. */
export function setActivityActor(next) {
  actor = next
}

function actorName(user) {
  return (
    actor?.profile?.display_name ||
    actor?.admin?.display_name ||
    user.user_metadata?.display_name ||
    user.email ||
    'Admin'
  )
}

/**
 * Write a row to activity_log. Never throws — a failed log should not break the action.
 * @param {string} action     'created' | 'updated' | 'deleted' | 'status_changed' | ...
 * @param {string} entityType 'product' | 'category' | 'order' | 'settings' | 'quote' | ...
 * @param {string|null} entityId
 * @param {string} entityName
 * @param {object} details
 */
export async function logActivity(action, entityType, entityId, entityName, details = {}) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      console.warn('activityLogger: no signed-in user, skipping log')
      return
    }
    const { error } = await supabase.from('activity_log').insert({
      user_id: user.id,
      user_email: user.email,
      user_name: actorName(user),
      action,
      entity_type: entityType,
      entity_id: entityId ? String(entityId) : null,
      entity_name: entityName,
      details,
    })
    if (error) console.error('activityLogger: insert failed', error)
  } catch (err) {
    console.error('activityLogger: failed', err)
  }
}

export async function getRecentActivity(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('activityLogger: fetch failed', err)
    return []
  }
}

export async function getEntityActivity(entityType, entityId) {
  try {
    const { data, error } = await supabase
      .from('activity_log')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', String(entityId))
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('activityLogger: fetch failed', err)
    return []
  }
}
