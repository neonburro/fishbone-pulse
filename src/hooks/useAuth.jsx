/* eslint-disable react-refresh/only-export-components -- provider + hook live together on purpose */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { getAdminMembership, getProfile, resolveLogin } from '../lib/api/auth'
import { setActivityActor } from '../utils/activityLogger'

const AuthContext = createContext(null)

/**
 * status: 'loading' | 'signed_out' | 'not_admin' | 'admin'
 * Admin = row in admin_users. Profile comes from public.profiles (auto-created by trigger).
 */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null, profile: null, admin: null, error: null })
  const latest = useRef(0)

  const resolve = useCallback(async (session) => {
    const ticket = ++latest.current
    if (!session?.user) {
      setActivityActor(null)
      setState({ status: 'signed_out', user: null, profile: null, admin: null, error: null })
      return 'signed_out'
    }
    const user = session.user
    try {
      const [admin, profile] = await Promise.all([getAdminMembership(user.id), getProfile(user.id).catch(() => null)])
      if (ticket !== latest.current) return null
      const status = admin ? 'admin' : 'not_admin'
      setActivityActor({ user, profile, admin })
      setState({ status, user, profile, admin, error: null })
      return status
    } catch (err) {
      if (ticket !== latest.current) return null
      setState({ status: 'not_admin', user, profile: null, admin: null, error: err.message })
      return 'not_admin'
    }
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) {
      setState({ status: 'signed_out', user: null, profile: null, admin: null, error: 'Supabase is not configured. Copy .env.example to .env.' })
      return undefined
    }
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => resolve(session))
      .catch((err) => setState({ status: 'signed_out', user: null, profile: null, admin: null, error: err.message }))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // PASSWORD_RECOVERY / USER_UPDATED still resolve normally; the auth pages handle their own flow.
      if (event === 'TOKEN_REFRESHED' && session?.user) return
      resolve(session)
    })
    return () => subscription.unsubscribe()
  }, [resolve])

  const signIn = useCallback(
    async (identifier, password) => {
      const email = await resolveLogin(identifier)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      return resolve(data.session)
    },
    [resolve],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setActivityActor(null)
    setState({ status: 'signed_out', user: null, profile: null, admin: null, error: null })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!state.user) return null
    const [profile, admin] = await Promise.all([getProfile(state.user.id), getAdminMembership(state.user.id)])
    setActivityActor({ user: state.user, profile, admin })
    setState((s) => ({ ...s, profile, admin }))
    return profile
  }, [state.user])

  const value = useMemo(
    () => ({
      ...state,
      loading: state.status === 'loading',
      role: state.admin?.role || null,
      displayName: displayNameOf(state.user, state.profile, state.admin),
      signIn,
      signOut,
      refreshProfile,
    }),
    [state, signIn, signOut, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export function displayNameOf(user, profile, admin) {
  return profile?.display_name || admin?.display_name || user?.user_metadata?.display_name || user?.email || 'Admin'
}
