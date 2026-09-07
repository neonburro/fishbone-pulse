/* eslint-disable react-refresh/only-export-components -- provider + hook live together on purpose */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { previewUser, previewProfile, admins } from './fixtures'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')

const AuthContext = createContext(null)

/** Always-signed-in owner for layout review. Mirrors the real provider's shape. */
export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'admin', user: previewUser, profile: previewProfile, admin: admins[0], error: null })
  const signIn = useCallback(async () => {
    setState((s) => ({ ...s, status: 'admin' }))
    return 'admin'
  }, [])
  const signOut = useCallback(async () => setState({ status: 'signed_out', user: null, profile: null, admin: null, error: null }), [])
  const refreshProfile = useCallback(async () => state.profile, [state.profile])
  const value = useMemo(
    () => ({
      ...state,
      loading: false,
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
