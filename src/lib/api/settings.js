import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

/**
 * Canonical settings shapes. The storefront reads these keys verbatim, so keep them flat
 * (no nested address/social objects) and keep every row is_public = true.
 */
export const SETTINGS_DEFAULTS = {
  store: {
    name: 'Fishbone Graphics & Screen Printing',
    legal_name: '',
    tagline: '',
    founded: 1985,
    phone: '(970) 626-4437',
    email: '',
    admin_email: 'fishbonegraphics@neonburro.com',
    address1: '',
    address2: '',
    city: 'Ridgway',
    state: 'CO',
    zip: '81432',
    map_url: '',
    lat: null,
    lng: null,
    plus_code: '',
    directions_note: '',
    region: '',
    elevation_ft: null,
    landmarks: [],
    hours: [{ days: 'Mon–Fri', open: '9:00 AM', close: '5:00 PM' }],
    instagram: 'fishbonegraphics',
    facebook: '',
  },
  ordering: { turnaround_days: 10, rush_available: false, min_order_note: '' },
  tax: { rate: 0, label: 'Sales tax', note: '' },
  shipping: { flat_rate: 0, enabled: false, note: '' },
  payments: { provider: 'invoice', providers_available: ['invoice'], note: '' },
  announcement: { enabled: false, text: '' },
}

export const SETTINGS_KEYS = Object.keys(SETTINGS_DEFAULTS)

/** All settings as { key: value }. Missing keys fall back to defaults. */
export async function getAllSettings() {
  const rows = unwrap(await supabase.from('settings').select('key, value, is_public'))
  const out = {}
  for (const key of SETTINGS_KEYS) {
    const row = rows.find((r) => r.key === key)
    out[key] = { ...SETTINGS_DEFAULTS[key], ...(row?.value || {}) }
  }
  return out
}

/** Upsert one settings row. Storefront-facing keys stay public. */
export async function upsertSetting(key, value, { is_public = true } = {}) {
  const data = unwrap(await supabase.from('settings').upsert({ key, value, is_public }, { onConflict: 'key' }).select('*').single())
  await logActivity('updated', 'settings', key, `Settings · ${key}`)
  return data
}

export async function listAdmins() {
  return unwrap(await supabase.from('admin_users').select('user_id, email, display_name, role').order('email'))
}
