import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

export const QUOTE_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost']

export async function listQuotes({ status, search, page = 1, pageSize = 25 } = {}) {
  let query = supabase
    .from('quote_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (status && status !== 'all') query = query.eq('status', status)
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
  return unwrap(await supabase.from('quote_requests').select('*').eq('id', id).maybeSingle())
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
  if (error) throw new Error(error.message)
  return count || 0
}
