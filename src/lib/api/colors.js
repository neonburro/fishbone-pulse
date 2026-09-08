// src/lib/api/colors.js
//
// blank_colors: every color the catalog lists for a style, with a hex we
// averaged from the swatch photo and the photo itself. The shop can also
// type its own color name, this is a helper, not a fence.

import { supabase, unwrap } from '../supabase'

export async function listBlankColors({ brand, style_number } = {}) {
  let q = supabase.from('blank_colors').select('id, brand, style_number, color_name, color_hex, swatch_url, sort_order').order('sort_order')
  if (brand) q = q.ilike('brand', brand)
  if (style_number) q = q.ilike('style_number', style_number)
  return unwrap(await q) || []
}

export async function listBlankStyles() {
  const rows = unwrap(await supabase.from('blank_colors').select('brand, style_number')) || []
  const seen = new Map()
  for (const r of rows) seen.set(`${r.brand}|${r.style_number}`, r)
  return [...seen.values()]
}

/** Stock on the shelf becomes a color on the storefront. Returns the variant id. */
export async function ensureVariant(productId, { color_name, color_hex, image_url }) {
  const { data, error } = await supabase.rpc('ensure_variant', { p_product_id: productId, p_color_name: color_name, p_color_hex: color_hex || null, p_image_url: image_url || null })
  if (error) throw new Error(error.message || 'Could not add that color to the blank')
  return data
}
