import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

export { QUOTE_STATUSES } from '../enums'

export async function listQuotes({ status, requestType, search, page = 1, pageSize = 25 } = {}) {
  let query = supabase
    .from('quote_requests')
    .select('*', { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
  if (requestType && requestType !== 'all') query = query.eq('request_type', requestType)
  const term = (search || '').trim()
  if (term) {
    const like = `%${term.replace(/[%_]/g, '\\$&')}%`
    query = query.or(`name.ilike.${like},email.ilike.${like},company.ilike.${like},event_name.ilike.${like}`)
  }
  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw new Error(error.message)
  return { rows: data || [], count: count || 0, page, pageSize }
}

export async function getQuote(id) {
  return unwrap(await supabase.from('quote_requests').select('*, order:orders!quote_requests_order_id_fkey(id, order_number, status)').eq('id', id).maybeSingle())
}

/** A request becomes a run. Admin only, one tap, links both ways. */
export async function startRun(requestId) {
  const { data, error } = await supabase.rpc('start_run_from_request', { p_request_id: requestId })
  if (error) throw new Error(error.message || 'Could not start the run')
  await logActivity('created', 'order', data.order_id, data.order_number, { from_request: requestId })
  return data
}

export async function updateQuoteStatus(id, status, { name, previous } = {}) {
  const data = unwrap(
    await supabase.from('quote_requests').update({ status }).eq('id', id).select('id, status, name').single(),
  )
  await logActivity('status_changed', 'quote', id, name || data.name, { from: previous, to: status })
  return data
}

export async function updateQuoteNotes(id, internal_notes) {
  return unwrap(
    await supabase.from('quote_requests').update({ internal_notes }).eq('id', id).select('id').single(),
  )
}

export async function countNewQuotes() {
  const { count, error } = await supabase
    .from('quote_requests')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'new')
    .is('deleted_at', null)
  if (error) throw new Error(error.message)
  return count || 0
}

/** request_type values written by the storefront forms. */
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


export async function trashRequest(id, initials, { name } = {}) {
  const ini = String(initials || '').trim().toUpperCase().slice(0, 4)
  if (ini.length < 2) throw new Error('Your initials, two letters at least.')
  unwrap(await supabase.from('quote_requests').update({ deleted_at: new Date().toISOString(), deleted_by: ini }).eq('id', id).select('id').single())
  await logActivity('trashed', 'quote', id, name, { by: ini })
  return true
}
export async function restoreRequest(id) {
  unwrap(await supabase.from('quote_requests').update({ deleted_at: null, deleted_by: null }).eq('id', id).select('id').single())
  return true
}
export async function purgeRequests(ids) {
  if (!ids?.length) return 0
  unwrap(await supabase.from('quote_requests').delete().in('id', ids).not('deleted_at', 'is', null).select('id'))
  return ids.length
}
export async function listTrashedRequests() {
  return unwrap(await supabase.from('quote_requests').select('id, name, email, company, event_name, request_type, deleted_at, deleted_by, created_at').not('deleted_at', 'is', null).order('deleted_at', { ascending: false })) || []
}
