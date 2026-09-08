// src/lib/api/stock.js
//
// The shelf. stock_items are things you count, blanks (style plus color plus
// size) and printed shirts (a design on a blank). stock_moves is the
// ledger, every in and every out with initials and a time. The count on an
// item is never edited, it is the sum of its moves, read from the
// stock_levels view. A recount is a move with reason count_adjust.
// Dozens or pieces per item, and a move can be entered in either.
//
// No oxford commas, no em dashes.

import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

export const STOCK_UNITS = ['each', 'dozen']
export const STOCK_KINDS = ['blank', 'printed']
export const STOCK_REASONS = {
  received: 'Received',
  pulled_for_run: 'Pulled for a run',
  sold: 'Sold',
  misprint: 'Misprint',
  count_adjust: 'Recount',
  returned: 'Returned',
  other: 'Other',
}

const ITEM_FIELDS = 'id, kind, name, brand, style_number, color_name, color_hex, size, design_name, product_id, variant_id, unit, par_level, location, sell_price, is_random, is_active, notes, created_at, updated_at'

export async function listStock({ search = '', kind, activeOnly = true } = {}) {
  let q = supabase.from('stock_items').select(ITEM_FIELDS).order('name').order('color_name').order('size')
  if (activeOnly) q = q.eq('is_active', true)
  if (kind && STOCK_KINDS.includes(kind)) q = q.eq('kind', kind)
  if (search.trim()) {
    const s = `%${search.trim()}%`
    q = q.or(`name.ilike.${s},brand.ilike.${s},style_number.ilike.${s},color_name.ilike.${s},design_name.ilike.${s},size.ilike.${s}`)
  }
  const items = unwrap(await q)
  const levels = unwrap(await supabase.from('stock_levels').select('item_id, on_hand, last_move_at'))
  const byId = Object.fromEntries((levels || []).map((l) => [l.item_id, l]))
  return (items || []).map((i) => ({ ...i, on_hand: Number(byId[i.id]?.on_hand ?? 0), last_move_at: byId[i.id]?.last_move_at || null }))
}

export async function getStockItem(id) {
  const item = unwrap(await supabase.from('stock_items').select(ITEM_FIELDS).eq('id', id).single())
  const level = unwrap(await supabase.from('stock_levels').select('on_hand, last_move_at').eq('item_id', id).maybeSingle())
  const moves = unwrap(
    await supabase.from('stock_moves').select('id, quantity, unit, direction, reason, order_id, initials, note, created_at').eq('item_id', id).order('created_at', { ascending: false }).limit(200),
  )
  return { ...item, on_hand: Number(level?.on_hand ?? 0), last_move_at: level?.last_move_at || null, moves: moves || [] }
}

export async function createStockItem(input) {
  const row = clean(input)
  const item = unwrap(await supabase.from('stock_items').insert(row).select(ITEM_FIELDS).single())
  logActivity({ action: 'created', entity_type: 'stock_item', entity_id: item.id, entity_name: item.name })
  return item
}

export async function updateStockItem(id, input) {
  const item = unwrap(await supabase.from('stock_items').update(clean(input)).eq('id', id).select(ITEM_FIELDS).single())
  logActivity({ action: 'updated', entity_type: 'stock_item', entity_id: item.id, entity_name: item.name })
  return item
}

/** A move. quantity is positive, direction says which way. initials required. */
export async function addStockMove(itemId, { quantity, unit, direction, reason, initials, note, order_id }) {
  const qty = Number(quantity)
  if (!(qty > 0)) throw new Error('Enter a quantity above zero.')
  if (!STOCK_UNITS.includes(unit)) throw new Error('Pick each or dozen.')
  if (!['in', 'out'].includes(direction)) throw new Error('In or out.')
  const ini = String(initials || '').trim().toUpperCase().slice(0, 4)
  if (ini.length < 2) throw new Error('Your initials, so the count stays honest.')
  const { data: auth } = await supabase.auth.getUser()
  const row = { item_id: itemId, quantity: qty, unit, direction, reason: STOCK_REASONS[reason] ? reason : 'other', initials: ini, note: note?.trim() || null, order_id: order_id || null, actor_id: auth?.user?.id || null }
  const move = unwrap(await supabase.from('stock_moves').insert(row).select('*').single())
  logActivity({ action: direction === 'in' ? 'stock_in' : 'stock_out', entity_type: 'stock_item', entity_id: itemId, details: { quantity: qty, unit, reason, initials: ini } })
  return move
}

export async function countLowStock() {
  const rows = await listStock()
  return rows.filter((r) => r.par_level > 0 && r.on_hand < r.par_level).length
}

function clean(input) {
  const s = (v) => (v == null ? null : String(v).trim() || null)
  return {
    kind: STOCK_KINDS.includes(input.kind) ? input.kind : 'blank',
    name: s(input.name) || [input.brand, input.style_number, input.color_name, input.size].filter(Boolean).join(' '),
    brand: s(input.brand),
    style_number: s(input.style_number),
    color_name: s(input.color_name),
    color_hex: s(input.color_hex),
    size: s(input.size),
    design_name: s(input.design_name),
    product_id: input.product_id || null,
    variant_id: input.variant_id || null,
    unit: STOCK_UNITS.includes(input.unit) ? input.unit : 'each',
    par_level: Number(input.par_level) || 0,
    location: s(input.location),
    sell_price: input.sell_price === '' || input.sell_price == null ? null : Number(input.sell_price),
    is_random: Boolean(input.is_random),
    is_active: input.is_active !== false,
    notes: s(input.notes),
  }
}
