import * as fx from '../fixtures'
import { wait, clone } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')

export const USERNAME_RE = /^[a-z0-9._-]{2,32}$/
export const ROLES = ['owner', 'admin', 'staff']
export const cleanUsername = (v) => String(v || '').toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9._-]/g, '').slice(0, 32)
export const isValidUsername = (v) => USERNAME_RE.test(v || '')

const state = { profile: clone(fx.previewProfile), requests: [] }

export async function resolveLogin(identifier) {
  await wait()
  const t = String(identifier || '').trim().toLowerCase()
  const m = fx.teamMembers.find((x) => x.email === t || x.profiles?.username === t)
  if (!m) throw new Error(t.includes('@') ? 'No account matches that email.' : 'Username not recognized.')
  return m.email
}
export async function sendPasswordReset(identifier) {
  return resolveLogin(identifier)
}
export async function requestAccount(input) {
  await wait(300)
  state.requests.push({ id: `req-${Date.now()}`, ...input, status: 'new', created_at: new Date().toISOString() })
  return { id: state.requests[state.requests.length - 1].id }
}
export async function getProfile() {
  await wait()
  return clone(state.profile)
}
export async function getAdminMembership() {
  await wait()
  return clone(fx.admins[0])
}
export async function isUsernameAvailable(username, excludeUserId) {
  await wait(200)
  return !fx.teamMembers.some((m) => m.profiles?.username === username && m.user_id !== excludeUserId)
}
export async function updateProfile(_userId, patch) {
  await wait()
  Object.assign(state.profile, patch, { updated_at: new Date().toISOString() })
  return clone(state.profile)
}
export async function consumeHashSession() {
  await wait(50)
  return { ok: false, type: null, error: null, missing: true }
}
