import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

export async function listCategories({ includeCounts = true } = {}) {
  const cols = includeCounts ? '*, products(count)' : '*'
  return unwrap(await supabase.from('categories').select(cols).order('sort_order').order('name'))
}

export async function createCategory(input) {
  const data = unwrap(
    await supabase
      .from('categories')
      .insert({
        key: input.key,
        name: input.name,
        tagline: input.tagline || null,
        description: input.description || null,
        image_url: input.image_url || null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active !== false,
      })
      .select('*')
      .single(),
  )
  await logActivity('created', 'category', data.id, data.name)
  return data
}

export async function updateCategory(id, patch) {
  const data = unwrap(await supabase.from('categories').update(patch).eq('id', id).select('*').single())
  await logActivity('updated', 'category', id, data.name, { fields: Object.keys(patch) })
  return data
}

export async function deleteCategory(id, name) {
  unwrap(await supabase.from('categories').delete().eq('id', id))
  await logActivity('deleted', 'category', id, name)
}

/** Persist a new order for an array of {id} objects. */
export async function reorderCategories(ordered) {
  await Promise.all(
    ordered.map((c, i) => supabase.from('categories').update({ sort_order: i }).eq('id', c.id)),
  )
  await logActivity('reordered', 'category', null, 'Categories', { order: ordered.map((c) => c.key) })
}
