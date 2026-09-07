import * as fx from '../fixtures'
import { wait, clone, matches, paginate } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { customers: clone(fx.customers) }

export async function listCustomers({ search, page = 1, pageSize = 25 } = {}) {
  await wait()
  return paginate(state.customers.filter((c) => matches(search, c.name, c.email, c.company, c.phone)), page, pageSize)
}
export async function getCustomer(id) {
  await wait()
  return clone(state.customers.find((c) => c.id === id) || null)
}
export async function ordersForCustomer(customerId) {
  await wait()
  return clone(fx.orders.filter((o) => o.customer_id === customerId))
}
export async function updateCustomerNotes(id, notes) {
  await wait()
  const c = state.customers.find((x) => x.id === id)
  c.notes = notes
  return clone(c)
}
