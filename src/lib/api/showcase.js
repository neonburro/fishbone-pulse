import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'
import { removeShowcaseImage } from './storage'

export const PLACEMENTS = [
  { key: 'home', label: 'Home wall', help: 'The graphics wall on the storefront home page.' },
  { key: 'work', label: 'Work gallery', help: 'The /work gallery grid.' },
  { key: 'hero', label: 'Hero', help: 'Large hero images rotated at the top of the home page.' },
]

const COLS = 'id, placement, title, subtitle, client_name, year, image_path, image_url, alt, link_url, tags, accent_hex, width, height, sort_order, is_active, created_at'

export async function listShowcase(placement) {
  let q = supabase.from('showcase_items').select(COLS).order('sort_order').order('created_at')
  if (placement && placement !== 'all') q = q.eq('placement', placement)
  return unwrap(await q)
}

export async function countShowcase() {
  const { count, error } = await supabase.from('showcase_items').select('id', { count: 'exact', head: true }).eq('is_active', true)
  if (error) throw new Error(error.message)
  return count || 0
}

export async function createShowcaseItem(input) {
  const data = unwrap(
    await supabase
      .from('showcase_items')
      .insert({
        placement: input.placement,
        title: input.title || null,
        subtitle: input.subtitle || null,
        client_name: input.client_name || null,
        year: input.year || null,
        image_path: input.image_path,
        image_url: input.image_url,
        alt: input.alt || null,
        link_url: input.link_url || null,
        tags: input.tags || [],
        accent_hex: input.accent_hex || null,
        width: input.width || null,
        height: input.height || null,
        sort_order: input.sort_order ?? 0,
        is_active: input.is_active !== false,
      })
      .select(COLS)
      .single(),
  )
  await logActivity('created', 'showcase_item', data.id, data.title || data.client_name || data.image_path, { placement: data.placement })
  return data
}

export async function updateShowcaseItem(id, patch) {
  const data = unwrap(await supabase.from('showcase_items').update(patch).eq('id', id).select(COLS).single())
  await logActivity('updated', 'showcase_item', id, data.title || data.client_name || data.image_path, { fields: Object.keys(patch) })
  return data
}

export async function deleteShowcaseItem(item) {
  unwrap(await supabase.from('showcase_items').delete().eq('id', item.id))
  await removeShowcaseImage(item.image_path)
  await logActivity('deleted', 'showcase_item', item.id, item.title || item.client_name || item.image_path)
}

/** Persist order for one placement. */
export async function reorderShowcase(ordered) {
  await Promise.all(ordered.map((it, i) => supabase.from('showcase_items').update({ sort_order: i }).eq('id', it.id)))
}
