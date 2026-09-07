import { create } from 'zustand'
import { previewUser, admins } from './fixtures'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
/** Always-signed-in admin for layout review. Mirrors the real store's shape. */
export const useAuthStore = create((set) => ({
  status: 'admin',
  session: { user: previewUser },
  user: previewUser,
  admin: admins[0],
  error: null,
  async init() {},
  async signIn() {
    set({ status: 'admin' })
    return 'admin'
  },
  async signOut() {
    set({ status: 'signed_out', user: null, admin: null, session: null })
  },
}))

export const displayNameOf = (user, admin) => admin?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Admin'
