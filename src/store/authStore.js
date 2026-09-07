import { create } from 'zustand'
import { supabase, supabaseConfigured } from '../lib/supabase'

/**
 * Auth + admin membership state shared across the app.
 * status: 'loading' | 'signed_out' | 'not_admin' | 'admin'
 */
export const useAuthStore = create((set, get) => ({
  status: 'loading',
  session: null,
  user: null,
  admin: null,
  error: null,
  _subscribed: false,

  async checkAdmin(user) {
    if (!user) return null
    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id, email, display_name, role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) throw error
    return data
  },

  async resolve(session) {
    if (!session?.user) {
      set({ status: 'signed_out', session: null, user: null, admin: null })
      return
    }
    try {
      const admin = await get().checkAdmin(session.user)
      set({
        session,
        user: session.user,
        admin,
        status: admin ? 'admin' : 'not_admin',
        error: null,
      })
    } catch (err) {
      set({ session, user: session.user, admin: null, status: 'not_admin', error: err.message })
    }
  },

  async init() {
    if (!supabaseConfigured) {
      set({ status: 'signed_out', error: 'Supabase is not configured. Copy .env.example to .env.' })
      return
    }
    if (!get()._subscribed) {
      supabase.auth.onAuthStateChange((_event, session) => {
        get().resolve(session)
      })
      set({ _subscribed: true })
    }
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      await get().resolve(session)
    } catch (err) {
      set({ status: 'signed_out', error: err.message })
    }
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    await get().resolve(data.session)
    return get().status
  },

  async signOut() {
    await supabase.auth.signOut()
    set({ status: 'signed_out', session: null, user: null, admin: null })
  },
}))

export const displayNameOf = (user, admin) =>
  admin?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Admin'
