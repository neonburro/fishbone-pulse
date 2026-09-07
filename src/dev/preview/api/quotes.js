import * as fx from '../fixtures'
import { wait, clone, matches, paginate } from './_util'

export { QUOTE_STATUSES } from '../../../lib/enums'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { quotes: clone(fx.quotes) }
const find = (id) => state.quotes.find((q) => q.id === id)

export async function listQuotes({ status, search, page = 1, pageSize = 25 } = {}) {
  await wait()
  let rows = state.quotes
  if (status && status !== 'all') rows = rows.filter((q) => q.status === status)
  rows = rows.filter((q) => matches(search, q.name, q.email, q.company, q.event_name))
  return paginate(rows, page, pageSize)
}
export async function getQuote(id) {
  await wait()
  return clone(find(id) || null)
}
export async function updateQuoteStatus(id, status) {
  await wait()
  find(id).status = status
  return clone(find(id))
}
export async function updateQuoteNotes(id, internal_notes) {
  await wait()
  find(id).internal_notes = internal_notes
  return clone(find(id))
}
export async function countNewQuotes() {
  await wait()
  return state.quotes.filter((q) => q.status === 'new').length
}
