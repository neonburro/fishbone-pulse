import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

export const SETTINGS_DEFAULTS = {
  store: {
    name: 'Fishbone Graphics & Screen Printing',
    phone: '(970) 626-4437',
    email: '',
    address: 'Ridgway, CO 81432',
    hours: 'Mon–Fri 9am–5pm',
    social: { instagram: 'fishbonegraphics', facebook: '' },
  },
  ordering: { turnaround_days: 10, min_order_note: '' },
  tax: { rate: 0 },
  shipping: { flat_rate: 0, enabled: false },
  payments: { provider: 'invoice', note: '' },
  announcement: { enabled: false, text: '' },
}

/** All settings as { key: value }. Missing keys fall back to defaults. */
export async function getAllSettings() {
  const rows = unwrap(await supabase.from('settings').select('key, value, is_public'))
  const out = {}
  for (const key of Object.keys(SETTINGS_DEFAULTS)) {
    const row = rows.find((r) => r.key === key)
    out[key] = { ...SETTINGS_DEFAULTS[key], ...(row?.value || {}) }
  }
  return out
}

export async function upsertSetting(key, value, { is_public } = {}) {
  const row = { key, value }
  if (typeof is_public === 'boolean') row.is_public = is_public
  const data = unwrap(await supabase.from('settings').upsert(row, { onConflict: 'key' }).select('*').single())
  await logActivity('updated', 'settings', key, `Settings · ${key}`)
  return data
}

export async function listAdmins() {
  return unwrap(await supabase.from('admin_users').select('user_id, email, display_name, role').order('email'))
}
