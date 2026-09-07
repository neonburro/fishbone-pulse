import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseConfigured) {
  // Do not throw: let the login page render and explain the problem instead of a blank screen.
  console.error(
    'Fishbone Pulse: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY are missing. Copy .env.example to .env.',
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://missing-config.supabase.co',
  supabaseAnonKey || 'missing-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
)

/** Unwrap a supabase-js response, throwing a real Error on failure. */
export function unwrap({ data, error }) {
  if (error) {
    const err = new Error(error.message || 'Request failed')
    err.code = error.code
    err.details = error.details
    throw err
  }
  return data
}

/** Turn any thrown value into a user-friendly message. */
export function friendlyError(err, fallback = 'Something went wrong') {
  if (!err) return fallback
  const msg = err.message || String(err)
  if (/Failed to fetch|NetworkError|Load failed|ERR_NETWORK/i.test(msg)) {
    return 'Could not reach the server. Check your connection and try again.'
  }
  if (/Invalid login credentials/i.test(msg)) {
    return 'That email and password combination did not match.'
  }
  if (/Email not confirmed/i.test(msg)) {
    return 'This email address has not been confirmed yet.'
  }
  return msg || fallback
}
