import * as fx from '../fixtures'
import { wait, clone, matches, paginate } from './_util'

export { QUOTE_STATUSES } from '../../../lib/enums'
export const QUOTE_REQUEST_TYPES = [
  { key: 'quote', label: 'Run request' },
  { key: 'design', label: 'Design' },
  { key: 'festival', label: 'Festival merch' },
  { key: 'custom', label: 'Custom order' },
  { key: 'business', label: 'Business / crew' },
  { key: 'school', label: 'School / team' },
  { key: 'contact', label: 'Contact form' },
  { key: 'other', label: 'Other' },
]

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { quotes: clone(fx.quotes) }
const find = (id) => state.quotes.find((q) => q.id === id)

export async function listQuotes({ status, requestType, search, page = 1, pageSize = 25 } = {}) {
  await wait()
  let rows = state.quotes
  if (status && status !== 'all') rows = rows.filter((q) => q.status === status)
  if (requestType && requestType !== 'all') rows = rows.filter((q) => q.request_type === requestType)
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


export async function startRun(_requestId) {
  await wait()
  return { order_id: 'ord-1', order_number: 'FB-26-01007', existing: false }
}


export async function trashRequest(id, initials) { await wait(); if (String(initials || '').length < 2) throw new Error('Your initials, two letters at least.'); return true }
export async function restoreRequest() { await wait(); return true }
export async function purgeRequests(ids) { await wait(); return ids.length }
export async function listTrashedRequests() { await wait(); return [] }
