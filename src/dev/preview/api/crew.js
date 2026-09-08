// src/dev/preview/api/crew.js
// In-memory twin of lib/api/crew.js. Dev only.
import { wait, clone } from './_util'
export const ONLINE_MINUTES = 5
export const isOnline = (t) => !!t && Date.now() - new Date(t).getTime() < ONLINE_MINUTES * 60000
const now = () => new Date().toISOString()
let crew = [
  { user_id: 'u-treagan', username: 'treagan', display_name: 'Tyler Reagan', email: 'tyler@neonburro.com', avatar_url: null, last_seen_at: now(), role: 'owner' },
  { user_id: 'u-jack', username: 'jack', display_name: 'Jack Rajca', email: 'sales@fishbonegraphics.com', avatar_url: null, last_seen_at: now(), role: 'admin' },
  { user_id: 'u-press', username: 'press', display_name: 'Press Crew', email: 'press@fishbonegraphics.com', avatar_url: null, last_seen_at: new Date(Date.now() - 3600000).toISOString(), role: 'staff' },
]
let dms = [
  { id: 'd1', sender_id: 'u-jack', recipient_id: 'u-treagan', content: 'Blue Jean 1717s landed. Forty dozen on the back wall.', order_id: null, read_at: null, created_at: new Date(Date.now() - 1800000).toISOString() },
]
export async function listCrew() { await wait(); return clone(crew.map((c) => ({ ...c, name: c.display_name, online: isOnline(c.last_seen_at) }))) }
export async function heartbeat() { await wait(10) }
export async function setAvatar(userId, file) { await wait(); const url = URL.createObjectURL(file); crew = crew.map((c) => (c.user_id === userId ? { ...c, avatar_url: url } : c)); return clone(crew.find((c) => c.user_id === userId)) }
export async function clearAvatar(userId) { await wait(); crew = crew.map((c) => (c.user_id === userId ? { ...c, avatar_url: null } : c)); return clone(crew.find((c) => c.user_id === userId)) }
export async function listConversations(userId) { await wait(); const map = new Map(); for (const m of [...dms].reverse()) { const o = m.sender_id === userId ? m.recipient_id : m.sender_id; if (!map.has(o)) map.set(o, { partnerId: o, last: m, unread: 0 }); if (m.recipient_id === userId && !m.read_at) map.get(o).unread += 1 } return [...map.values()] }
export async function listThread(userId, partnerId) { await wait(); return clone(dms.filter((m) => (m.sender_id === userId && m.recipient_id === partnerId) || (m.sender_id === partnerId && m.recipient_id === userId))) }
export async function sendMessage(userId, partnerId, content, orderId = null) { await wait(); const m = { id: `d${Date.now()}`, sender_id: userId, recipient_id: partnerId, content: String(content).trim(), order_id: orderId, read_at: null, created_at: now() }; dms.push(m); return clone(m) }
export async function markThreadRead(userId, partnerId) { dms = dms.map((m) => (m.recipient_id === userId && m.sender_id === partnerId && !m.read_at ? { ...m, read_at: now() } : m)) }
export async function countUnread(userId) { return dms.filter((m) => m.recipient_id === userId && !m.read_at).length }
