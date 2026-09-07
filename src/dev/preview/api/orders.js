import * as fx from '../fixtures'
import { wait, clone, matches, paginate } from './_util'
import { PAGE_SIZE } from '../../../lib/enums'

export { ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_PROVIDERS, PAGE_SIZE } from '../../../lib/enums'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { orders: clone(fx.orders), items: clone(fx.orderItems), events: clone(fx.orderEvents) }
const find = (id) => state.orders.find((o) => o.id === id)

export async function listOrders({ status, search, page = 1, pageSize = PAGE_SIZE } = {}) {
  await wait()
  let rows = state.orders
  if (status && status !== 'all') rows = rows.filter((o) => o.status === status)
  rows = rows.filter((o) => matches(search, o.order_number, o.contact?.email, o.contact?.name))
  return paginate(rows, page, pageSize)
}

export async function searchOrders(term, limit = 8) {
  await wait()
  if (!term?.trim()) return []
  return state.orders.filter((o) => matches(term, o.order_number, o.contact?.email, o.contact?.name)).slice(0, limit)
}

export async function getOrder(id) {
  await wait()
  const o = find(id)
  if (!o) return null
  const customer = fx.customers.find((c) => c.id === o.customer_id) || null
  return { ...clone(o), customer, items: clone(state.items[id] || []), events: clone(state.events[id] || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }
}

function pushEvent(id, type, message) {
  state.events[id] = state.events[id] || []
  state.events[id].unshift({ id: `ev-${Date.now()}`, order_id: id, actor_id: fx.previewUser.id, actor_label: 'Rae Fisher', type, message, meta: {}, created_at: new Date().toISOString() })
}

export async function updateOrderStatus(id, status, { previous } = {}) {
  await wait()
  const o = find(id)
  o.status = status
  pushEvent(id, 'status_changed', `Status changed from ${previous} to ${status}`)
  return clone(o)
}
export async function updatePaymentStatus(id, payment_status) {
  await wait()
  const o = find(id)
  o.payment_status = payment_status
  pushEvent(id, 'payment_status_changed', `Payment marked ${payment_status}`)
  return clone(o)
}
export async function updatePaymentDetails(id, patch) {
  await wait()
  Object.assign(find(id), patch)
  return clone(find(id))
}
export async function updateInternalNotes(id, internal_notes) {
  await wait()
  find(id).internal_notes = internal_notes
  return clone(find(id))
}
export async function addOrderEvent(orderId, message, { type = 'note' } = {}) {
  await wait()
  pushEvent(orderId, type, message)
  return clone(state.events[orderId][0])
}
export async function getOrderStats() {
  await wait()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const count = (s) => state.orders.filter((o) => o.status === s).length
  return {
    needsReview: count('pending_review'),
    inProduction: count('in_production'),
    ready: count('ready_for_pickup'),
    awaitingPayment: count('awaiting_payment'),
    revenueMTD: state.orders.filter((o) => o.payment_status === 'paid' && new Date(o.created_at) >= monthStart).reduce((a, o) => a + o.total, 0),
  }
}
export async function recentOrders(limit = 10) {
  await wait()
  return clone(state.orders.slice(0, limit))
}
