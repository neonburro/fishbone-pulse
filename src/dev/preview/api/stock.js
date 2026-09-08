// src/dev/preview/api/stock.js
// In-memory twin of lib/api/stock.js for preview mode. Dev only.
import { wait as delay, clone } from './_util'

export const STOCK_UNITS = ['each', 'dozen']
export const STOCK_KINDS = ['blank', 'printed']
export const STOCK_REASONS = { received: 'Received', pulled_for_run: 'Pulled for a run', sold: 'Sold', misprint: 'Misprint', count_adjust: 'Recount', returned: 'Returned', other: 'Other' }

let items = [
  { id: 's1', kind: 'blank', name: 'Comfort Colors 1717 Pepper L', brand: 'Comfort Colors', style_number: '1717', color_name: 'Pepper', color_hex: '#3F3F3F', size: 'L', unit: 'dozen', par_level: 2, location: 'Back wall, shelf 3', sell_price: null, is_random: false, is_active: true, notes: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 's2', kind: 'printed', name: 'Telluride Bluegrass 45 · 1717 Blue Jean M', brand: 'Comfort Colors', style_number: '1717', color_name: 'Blue Jean', color_hex: '#4E5D74', size: 'M', design_name: 'Telluride Bluegrass 45', unit: 'each', par_level: 0, location: 'Front rack', sell_price: 25, is_random: true, is_active: true, notes: 'Off the pile', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
]
let moves = [
  { id: 'm1', item_id: 's1', quantity: 4, unit: 'dozen', direction: 'in', reason: 'received', initials: 'JR', note: 'S&S order', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
  { id: 'm2', item_id: 's1', quantity: 30, unit: 'each', direction: 'out', reason: 'pulled_for_run', initials: 'JR', note: 'FB-26-01003', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: 'm3', item_id: 's2', quantity: 3, unit: 'each', direction: 'in', reason: 'received', initials: 'JR', note: 'Extras off the run', created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
]
const factor = (from, to) => (from === to ? 1 : from === 'dozen' && to === 'each' ? 12 : from === 'each' && to === 'dozen' ? 1 / 12 : 1)
const level = (item) => moves.filter((m) => m.item_id === item.id).reduce((s, m) => s + (m.direction === 'in' ? 1 : -1) * m.quantity * factor(m.unit, item.unit), 0)
const last = (item) => moves.filter((m) => m.item_id === item.id).map((m) => m.created_at).sort().pop() || null

export async function listStock({ search = '', kind } = {}) {
  await delay()
  const s = search.trim().toLowerCase()
  return clone(items.filter((i) => i.is_active && (!kind || i.kind === kind) && (!s || [i.name, i.brand, i.style_number, i.color_name, i.design_name, i.size].join(' ').toLowerCase().includes(s))).map((i) => ({ ...i, on_hand: level(i), last_move_at: last(i) })))
}
export async function getStockItem(id) {
  await delay()
  const item = items.find((i) => i.id === id)
  if (!item) throw new Error('Not found')
  return clone({ ...item, on_hand: level(item), last_move_at: last(item), moves: moves.filter((m) => m.item_id === id).sort((a, b) => b.created_at.localeCompare(a.created_at)) })
}
export async function createStockItem(input) {
  await delay()
  const item = { id: `s${Date.now()}`, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...input, name: input.name || [input.brand, input.style_number, input.color_name, input.size].filter(Boolean).join(' ') }
  items.push(item)
  return clone(item)
}
export async function updateStockItem(id, input) {
  await delay()
  const i = items.findIndex((x) => x.id === id)
  items[i] = { ...items[i], ...input, updated_at: new Date().toISOString() }
  return clone(items[i])
}
export async function addStockMove(itemId, { quantity, unit, direction, reason, initials, note }) {
  await delay()
  if (!(Number(quantity) > 0)) throw new Error('Enter a quantity above zero.')
  if (String(initials || '').trim().length < 2) throw new Error('Your initials, so the count stays honest.')
  const m = { id: `m${Date.now()}`, item_id: itemId, quantity: Number(quantity), unit, direction, reason, initials: String(initials).toUpperCase().slice(0, 4), note: note || null, created_at: new Date().toISOString() }
  moves.push(m)
  return clone(m)
}
export async function countLowStock() {
  const rows = await listStock()
  return rows.filter((r) => r.par_level > 0 && r.on_hand < r.par_level).length
}
