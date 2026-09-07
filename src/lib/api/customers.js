import { supabase, unwrap } from '../supabase'

export async function listCustomers({ search, page = 1, pageSize = 25 } = {}) {
  let query = supabase
    .from('customers')
    .select('*, orders(count)', { count: 'exact' })
    .order('created_at', { ascending: false, nullsFirst: false })
  const term = (search || '').trim()
  if (term) {
    const like = `%${term.replace(/[%_]/g, '\\$&')}%`
    query = query.or(`name.ilike.${like},email.ilike.${like},company.ilike.${like},phone.ilike.${like}`)
  }
  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw new Error(error.message)
  return { rows: data || [], count: count || 0, page, pageSize }
}

export async function getCustomer(id) {
  return unwrap(await supabase.from('customers').select('*').eq('id', id).maybeSingle())
}

export async function ordersForCustomer(customerId) {
  return unwrap(
    await supabase
      .from('orders')
      .select('id, order_number, status, payment_status, total, created_at, needed_by')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false }),
  )
}

export async function updateCustomerNotes(id, notes) {
  return unwrap(await supabase.from('customers').update({ notes }).eq('id', id).select('id').single())
}
