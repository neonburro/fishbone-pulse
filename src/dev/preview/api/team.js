import * as fx from '../fixtures'
import { wait, clone, newId } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')

const state = { members: clone(fx.teamMembers), requests: clone(fx.accountRequests) }

export async function listTeam() {
  await wait()
  return { members: clone(state.members), requests: clone(state.requests) }
}
export async function inviteMember({ email, display_name, role }) {
  await wait(300)
  state.members.push({ user_id: newId('user'), email, display_name: display_name || null, role, created_at: new Date().toISOString(), last_sign_in_at: null, invited: true, profiles: { username: null, display_name: display_name || null, avatar_url: null } })
  return { ok: true }
}
export async function approveRequest(request_id, role) {
  await wait(300)
  const r = state.requests.find((x) => x.id === request_id)
  if (!r) throw new Error('Request not found')
  r.status = 'approved'
  state.members.push({ user_id: newId('user'), email: r.email, display_name: r.name, role, created_at: new Date().toISOString(), last_sign_in_at: null, invited: true, profiles: { username: r.requested_username, display_name: r.name, avatar_url: null } })
  return { ok: true }
}
export async function declineRequest(request_id) {
  await wait()
  const r = state.requests.find((x) => x.id === request_id)
  if (r) r.status = 'declined'
  return { ok: true }
}
export async function setMemberRole(user_id, role) {
  await wait()
  const m = state.members.find((x) => x.user_id === user_id)
  if (!m) throw new Error('Member not found')
  m.role = role
  return { ok: true }
}
export async function removeMember(user_id) {
  await wait()
  state.members = state.members.filter((m) => m.user_id !== user_id)
  return { ok: true }
}
