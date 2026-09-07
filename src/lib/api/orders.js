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
