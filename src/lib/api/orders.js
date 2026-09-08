import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'
import { PAGE_SIZE } from '../enums'

export { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_PROVIDERS, PAGE_SIZE } from '../enums'

const LIST_COLUMNS =
  'id, order_number, status, payment_status, fulfillment, total, needed_by, created_at, contact, customer_id, order_items(count)'

/**
 * List orders with filters.
 * @param {{status?: string, search?: string, page?: number, pageSize?: number}} opts
 * @returns {{ rows: Array, count: number, page: number, pageSize: number }}
 */
export async function listOrders({ status, search, page = 1, pageSize = PAGE_SIZE } = {}) {
  let query = supabase
    .from('orders')
    .select(LIST_COLUMNS, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (status && status !== 'all') query = query.eq('status', status)

  const term = (search || '').trim()
  if (term) {
    // order number OR contact email/name (contact is jsonb)
    const like = `%${term.replace(/[%_]/g, '\\$&')}%`
    query = query.or(`order_number.ilike.${like},contact->>email.ilike.${like},contact->>name.ilike.${like}`)
  }

  const from = (page - 1) * pageSize
  query = query.range(from, from + pageSize - 1)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)
  return { rows: data || [], count: count || 0, page, pageSize }
}

/** Quick search for the top bar (limit 8). */
export async function searchOrders(term, limit = 8) {
  const t = (term || '').trim()
  if (!t) return []
  const like = `%${t.replace(/[%_]/g, '\\$&')}%`
  return unwrap(
    await supabase
      .from('orders')
      .select('id, order_number, status, total, contact, created_at')
      .or(`order_number.ilike.${like},contact->>email.ilike.${like},contact->>name.ilike.${like}`)
      .order('created_at', { ascending: false })
      .limit(limit),
  )
}

/** Full order with items, events and customer. */
export async function getOrder(id) {
  const order = unwrap(
    await supabase
      .from('orders')
      .select(
        `*,
         customer:customers(id, email, name, phone, company, notes),
         request:quote_requests!orders_request_id_fkey(id, request_type, event_name, event_date, needed_by, quantity_estimate, garment_interest, print_locations, description, artwork_files, status, created_at),
         items:order_items(*),
         events:order_events(*)`,
      )
      .eq('id', id)
      .maybeSingle(),
  )
  if (!order) return null
  order.items = (order.items || []).sort((a, b) => String(a.id).localeCompare(String(b.id)))
  order.events = (order.events || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  return order
}

export async function updateOrderStatus(id, status, { orderNumber, previous } = {}) {
  // order_events row is written by a DB trigger on status change.
  const data = unwrap(
    await supabase.from('orders').update({ status }).eq('id', id).select('id, status, order_number').single(),
  )
  await logActivity('status_changed', 'order', id, orderNumber || data.order_number, { from: previous, to: status })
  return data
}

export async function updatePaymentStatus(id, payment_status, { orderNumber, previous } = {}) {
  const data = unwrap(
    await supabase
      .from('orders')
      .update({ payment_status })
      .eq('id', id)
      .select('id, payment_status, order_number')
      .single(),
  )
  await logActivity('payment_status_changed', 'order', id, orderNumber || data.order_number, {
    from: previous,
    to: payment_status,
  })
  return data
}

export async function updatePaymentDetails(id, { payment_provider, payment_reference }) {
  return unwrap(
    await supabase
      .from('orders')
      .update({ payment_provider: payment_provider || null, payment_reference: payment_reference || null })
      .eq('id', id)
      .select('id, payment_provider, payment_reference')
      .single(),
  )
}

export async function updateInternalNotes(id, internal_notes) {
  return unwrap(
    await supabase.from('orders').update({ internal_notes }).eq('id', id).select('id, internal_notes').single(),
  )
}

/** Add a manual note to the order timeline. */
export async function addOrderEvent(orderId, message, { type = 'note', meta = {} } = {}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return unwrap(
    await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        actor_id: user?.id || null,
        actor_label: user?.user_metadata?.display_name || user?.email || 'Admin',
        type,
        message,
        meta,
      })
      .select('*')
      .single(),
  )
}

/** Dashboard stats. */
export async function getOrderStats() {
  const count = async (build) => {
    const { count: c, error } = await build(supabase.from('orders').select('id', { count: 'exact', head: true }))
    if (error) throw new Error(error.message)
    return c || 0
  }
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [needsReview, inProduction, ready, awaitingPayment, revenueRows] = await Promise.all([
    count((q) => q.eq('status', 'pending_review')),
    count((q) => q.eq('status', 'in_production')),
    count((q) => q.eq('status', 'ready_for_pickup')),
    count((q) => q.eq('status', 'awaiting_payment')),
    supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', monthStart),
  ])
  if (revenueRows.error) throw new Error(revenueRows.error.message)
  const revenueMTD = (revenueRows.data || []).reduce((acc, r) => acc + (parseFloat(r.total) || 0), 0)

  return { needsReview, inProduction, ready, awaitingPayment, revenueMTD }
}

export async function recentOrders(limit = 10) {
  return unwrap(
    await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total, contact, created_at, needed_by')
      .order('created_at', { ascending: false })
      .limit(limit),
  )
}


/**
 * Send the quote. Mints a token through issue_quote (admin only, logs the
 * event, moves pending_review to quoted) then hands the summary to the
 * send-quote Netlify function which emails the customer the link.
 */
export async function sendQuote(order, note) {
  const { data, error } = await supabase.rpc('issue_quote', { p_order_id: order.id, p_note: note || null })
  if (error) throw new Error(error.message || 'Could not issue the quote')
  const payload = {
    token: data.token,
    order_number: order.order_number,
    contact: order.contact,
    needed_by: order.needed_by,
    quote_note: note || order.quote_note || null,
    items: (order.items || []).map((it) => ({ product_name: it.product_name, variant_label: it.variant_label, quantity: it.quantity, unit_price: it.unit_price, line_total: it.line_total, print_locations: it.print_locations, size_breakdown: it.size_breakdown, notes: it.notes })),
    subtotal: order.subtotal, setup_fees: order.setup_fees, discount: order.discount, shipping: order.shipping, tax: order.tax, total: order.total,
  }
  let mailed = false
  try {
    const res = await fetch('/.netlify/functions/send-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const j = await res.json().catch(() => ({}))
    mailed = Boolean(j.ok)
  } catch { mailed = false }
  await logActivity('quote_sent', 'order', order.id, order.order_number, { mailed })
  return { token: data.token, mailed }
}


// ── a run from scratch ──────────────────────────────────────────────────────
export async function createRun({ contact, needed_by, notes, fulfillment }) {
  const { data, error } = await supabase.rpc('start_run_manual', { p_contact: contact, p_needed_by: needed_by || null, p_notes: notes || null, p_fulfillment: fulfillment || 'pickup' })
  if (error) throw new Error(error.message || 'Could not open the run')
  await logActivity('created', 'order', data.order_id, data.order_number, { source: 'pulse' })
  return data
}

// ── line items ──────────────────────────────────────────────────────────────
const num = (v) => (v === '' || v == null || Number.isNaN(Number(v)) ? 0 : Number(v))

export async function saveItem(orderId, item) {
  const qty = Math.max(0, Math.round(num(item.quantity)))
  const unit = Math.max(0, num(item.unit_price))
  const row = {
    order_id: orderId,
    product_id: item.product_id || null,
    variant_id: item.variant_id || null,
    product_name: String(item.product_name || '').trim() || 'Garment',
    variant_label: String(item.variant_label || '').trim() || null,
    sku: item.sku || null,
    quantity: qty,
    unit_price: unit,
    line_total: Math.round(unit * qty * 100) / 100,
    decoration_method: 'screen_print',
    print_locations: Array.isArray(item.print_locations) ? item.print_locations : [],
    size_breakdown: item.size_breakdown && typeof item.size_breakdown === 'object' ? item.size_breakdown : {},
    artwork_files: Array.isArray(item.artwork_files) ? item.artwork_files : [],
    notes: String(item.notes || '').trim() || null,
  }
  if (item.id) row.id = item.id
  const saved = unwrap(await supabase.from('order_items').upsert(row, { onConflict: 'id' }).select('*').single())
  const totals = await recalcTotals(orderId)
  return { item: saved, totals }
}

export async function removeItem(orderId, itemId) {
  unwrap(await supabase.from('order_items').delete().eq('id', itemId).eq('order_id', orderId))
  return recalcTotals(orderId)
}

export async function recalcTotals(orderId) {
  const { data, error } = await supabase.rpc('recalc_order_totals', { p_order_id: orderId })
  if (error) throw new Error(error.message || 'Could not total the run')
  return data
}

export async function updateOrderMoney(orderId, { setup_fees, discount, shipping }) {
  unwrap(await supabase.from('orders').update({ setup_fees: num(setup_fees), discount: num(discount), shipping: num(shipping) }).eq('id', orderId).select('id').single())
  return recalcTotals(orderId)
}

// ── trash ───────────────────────────────────────────────────────────────────
// Two letters and a time on the row. It leaves the lists, it can come back,
// and Delete forever is a second, separate tap.
export async function trashOrder(id, initials, { orderNumber } = {}) {
  const ini = String(initials || '').trim().toUpperCase().slice(0, 4)
  if (ini.length < 2) throw new Error('Your initials, two letters at least.')
  unwrap(await supabase.from('orders').update({ deleted_at: new Date().toISOString(), deleted_by: ini }).eq('id', id).select('id').single())
  await logActivity('trashed', 'order', id, orderNumber, { by: ini })
  return true
}

export async function restoreOrder(id) {
  unwrap(await supabase.from('orders').update({ deleted_at: null, deleted_by: null }).eq('id', id).select('id').single())
  return true
}

export async function purgeOrders(ids) {
  if (!ids?.length) return 0
  unwrap(await supabase.from('orders').delete().in('id', ids).not('deleted_at', 'is', null).select('id'))
  return ids.length
}

export async function listTrashedOrders() {
  return unwrap(await supabase.from('orders').select('id, order_number, contact, total, status, deleted_at, deleted_by, created_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })) || []
}

// ── reminder ────────────────────────────────────────────────────────────────
export async function sendReminder(order) {
  if (!order.quote_token) throw new Error('Send the quote first.')
  const payload = {
    token: order.quote_token, order_number: order.order_number, contact: order.contact, needed_by: order.needed_by, quote_note: order.quote_note, reminder: true,
    items: (order.items || []).map((it) => ({ product_name: it.product_name, variant_label: it.variant_label, quantity: it.quantity, unit_price: it.unit_price, line_total: it.line_total, print_locations: it.print_locations, size_breakdown: it.size_breakdown, notes: it.notes })),
    subtotal: order.subtotal, setup_fees: order.setup_fees, discount: order.discount, shipping: order.shipping, tax: order.tax, total: order.total,
  }
  let mailed = false
  try {
    const res = await fetch('/.netlify/functions/send-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    mailed = Boolean((await res.json().catch(() => ({}))).ok)
  } catch { mailed = false }
  await addOrderEvent(order.id, 'Quote reminder sent to the customer', { type: 'quote_reminder', meta: { mailed } })
  return { mailed }
}
