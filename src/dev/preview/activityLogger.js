import * as fx from './fixtures'
import { wait, clone } from './api/_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { activity: clone(fx.activity) }

export async function logActivity(action, entityType, entityId, entityName, details = {}) {
  state.activity.unshift({ id: `act-${Date.now()}`, user_id: fx.previewUser.id, user_email: fx.previewUser.email, user_name: 'Rae Fisher', action, entity_type: entityType, entity_id: entityId, entity_name: entityName, details, created_at: new Date().toISOString() })
}
export async function getRecentActivity(limit = 10) {
  await wait()
  return clone(state.activity.slice(0, limit))
}
export async function getEntityActivity(entityType, entityId) {
  await wait()
  return clone(state.activity.filter((a) => a.entity_type === entityType && a.entity_id === entityId))
}
