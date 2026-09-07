import { supabase, unwrap } from '../supabase'

export const USERNAME_RE = /^[a-z0-9._-]{2,32}$/
export const ROLES = ['owner', 'admin', 'staff']

/** Normalize what a user typed into a candidate username. */
export function cleanUsername(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 32)
}

export function isValidUsername(value) {
  return USERNAME_RE.test(value || '')
}

/**
 * Username OR email -> the email to sign in with (anon-callable RPC).
 * Throws 'Username not recognized' when unknown.
 */
export async function resolveLogin(identifier) {
  const trimmed = String(identifier || '')
    .trim()
    .toLowerCase()
  if (!trimmed) throw new Error('Enter your username or email.')
  const { data, error } = await supabase.rpc('resolve_login', { identifier: trimmed })
  if (error) throw new Error(error.message || 'Could not check that username. Try again.')
  if (!data) throw new Error(trimmed.includes('@') ? 'No account matches that email.' : 'Username not recognized.')
  return data
}

export async function sendPasswordReset(identifier) {
  const email = await resolveLogin(identifier)
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password/`,
  })
  if (error) throw error
  return email
}

/** Public "Request an account" form -> account_requests. */
export async function requestAccount({ name, email, requested_username, message }) {
  return unwrap(
    await supabase
      .from('account_requests')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        requested_username: requested_username ? cleanUsername(requested_username) : null,
        message: message?.trim() || null,
      })
      .select('id')
      .single(),
  )
}

export async function getProfile(userId) {
  return unwrap(
    await supabase
      .from('profiles')
      .select('user_id, username, display_name, email, avatar_url, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle(),
  )
}

export async function getAdminMembership(userId) {
  return unwrap(
    await supabase.from('admin_users').select('user_id, email, display_name, role').eq('user_id', userId).maybeSingle(),
  )
}

/** True when nobody else holds this username. */
export async function isUsernameAvailable(username, excludeUserId) {
  const clean = cleanUsername(username)
  if (!isValidUsername(clean)) return false
  let q = supabase.from('profiles').select('user_id').eq('username', clean).limit(1)
  if (excludeUserId) q = q.neq('user_id', excludeUserId)
  const rows = unwrap(await q)
  return rows.length === 0
}

export async function updateProfile(userId, patch) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .select('user_id, username, display_name, email, avatar_url, created_at, updated_at')
    .single()
  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) {
      throw new Error('That username is already taken. Pick another.')
    }
    throw new Error(error.message)
  }
  return data
}

/** Pull access/refresh tokens out of the URL hash (recovery + invite links) and start a session. */
export async function consumeHashSession() {
  const hash = window.location.hash?.startsWith('#') ? window.location.hash.slice(1) : ''
  const params = new URLSearchParams(hash)
  const access_token = params.get('access_token')
  const refresh_token = params.get('refresh_token')
  const type = params.get('type')
  const errorDescription = params.get('error_description') || params.get('error')

  if (errorDescription) {
    window.history.replaceState(null, '', window.location.pathname)
    return { ok: false, type, error: errorDescription.replace(/\+/g, ' ') }
  }
  if (!access_token || !refresh_token) return { ok: false, type: null, error: null, missing: true }

  const { data, error } = await supabase.auth.setSession({ access_token, refresh_token })
  window.history.replaceState(null, '', window.location.pathname)
  if (error) return { ok: false, type, error: error.message }
  return { ok: true, type, user: data.user }
}
