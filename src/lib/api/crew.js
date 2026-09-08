// src/lib/api/crew.js
//
// The crew: everyone with a Pulse login, from profiles joined to admin_users.
// Presence is a heartbeat on profiles.last_seen_at, online means seen in the
// last five minutes. Avatars live in the public site-media bucket under
// avatars/. Direct messages are one row per message in direct_messages.

import { supabase, unwrap } from '../supabase'
import { uploadSiteImage } from './storage'
import { updateProfile } from './auth'

export const ONLINE_MINUTES = 5

export function isOnline(lastSeenAt) {
  if (!lastSeenAt) return false
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_MINUTES * 60 * 1000
}

export async function listCrew() {
  const [profiles, admins] = await Promise.all([
    unwrap(await supabase.from('profiles').select('user_id, username, display_name, email, avatar_url, last_seen_at')),
    unwrap(await supabase.from('admin_users').select('user_id, display_name, role')),
  ])
  const roles = Object.fromEntries((admins || []).map((a) => [a.user_id, a]))
  return (profiles || [])
    .filter((p) => roles[p.user_id])
    .map((p) => ({ ...p, name: p.display_name || roles[p.user_id].display_name || p.username || p.email, role: roles[p.user_id].role, online: isOnline(p.last_seen_at) }))
    .sort((a, b) => Number(b.online) - Number(a.online) || String(a.name).localeCompare(String(b.name)))
}

export async function heartbeat(userId) {
  if (!userId) return
  await supabase.from('profiles').update({ last_seen_at: new Date().toISOString() }).eq('user_id', userId)
}

/** Avatar -> site-media/avatars/<uuid>.<ext>, then onto the profile. */
export async function setAvatar(userId, file) {
  const { url } = await uploadSiteImage(file, 'avatars')
  return updateProfile(userId, { avatar_url: url })
}

export async function clearAvatar(userId) {
  return updateProfile(userId, { avatar_url: null })
}

// ── messages ────────────────────────────────────────────────────────────────
const DM_FIELDS = 'id, sender_id, recipient_id, content, order_id, read_at, created_at'

export async function listConversations(userId) {
  const rows = unwrap(await supabase.from('direct_messages').select(DM_FIELDS).or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at', { ascending: false }).limit(500))
  const map = new Map()
  for (const m of rows || []) {
    const other = m.sender_id === userId ? m.recipient_id : m.sender_id
    if (!map.has(other)) map.set(other, { partnerId: other, last: m, unread: 0 })
    if (m.recipient_id === userId && !m.read_at) map.get(other).unread += 1
  }
  return [...map.values()]
}

export async function listThread(userId, partnerId) {
  return unwrap(
    await supabase.from('direct_messages').select(DM_FIELDS)
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: true }).limit(300),
  ) || []
}

export async function sendMessage(userId, partnerId, content, orderId = null) {
  const text = String(content || '').trim()
  if (!text) throw new Error('Say something first.')
  return unwrap(await supabase.from('direct_messages').insert({ sender_id: userId, recipient_id: partnerId, content: text, order_id: orderId }).select(DM_FIELDS).single())
}

export async function markThreadRead(userId, partnerId) {
  await supabase.from('direct_messages').update({ read_at: new Date().toISOString() }).eq('recipient_id', userId).eq('sender_id', partnerId).is('read_at', null)
}

export async function countUnread(userId) {
  const { count } = await supabase.from('direct_messages').select('id', { count: 'exact', head: true }).eq('recipient_id', userId).is('read_at', null)
  return count || 0
}
