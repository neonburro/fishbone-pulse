import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

export const PRICE_UNITS = ['each', 'per dozen', 'per set', 'per sq ft']

const LIST_COLUMNS =
  'id, slug, name, brand, style_number, category_id, base_price, price_unit, min_quantity, images, is_active, is_featured, featured_order, updated_at, category:categories(id, name, key), product_variants(count)'

export async function listProducts({ search, categoryId, active, page = 1, pageSize = 60 } = {}) {
  let query = supabase.from('products').select(LIST_COLUMNS, { count: 'exact' }).order('name')
  if (categoryId && categoryId !== 'all') query = query.eq('category_id', categoryId)
  if (active === 'active') query = query.eq('is_active', true)
  if (active === 'inactive') query = query.eq('is_active', false)
  const term = (search || '').trim()
  if (term) {
    const like = `%${term.replace(/[%_]/g, '\\$&')}%`
    query = query.or(`name.ilike.${like},slug.ilike.${like},brand.ilike.${like},style_number.ilike.${like}`)
  }
  const from = (page - 1) * pageSize
  const { data, error, count } = await query.range(from, from + pageSize - 1)
  if (error) throw new Error(error.message)
  return { rows: data || [], count: count || 0, page, pageSize }
}

export async function searchProducts(term, limit = 8) {
  const t = (term || '').trim()
  if (!t) return []
  const like = `%${t.replace(/[%_]/g, '\\$&')}%`
  return unwrap(
    await supabase
      .from('products')
      .select('id, name, slug, base_price, is_active, images')
      .or(`name.ilike.${like},slug.ilike.${like},style_number.ilike.${like}`)
      .order('name')
      .limit(limit),
  )
}

export async function getProduct(id) {
  const product = unwrap(
    await supabase
      .from('products')
      .select('*, variants:product_variants(*), tiers:pricing_tiers(*), category:categories(id, name, key)')
      .eq('id', id)
      .maybeSingle(),
  )
  if (!product) return null
  product.variants = (product.variants || []).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  product.tiers = (product.tiers || []).sort((a, b) => a.min_qty - b.min_qty)
  return product
}

export async function slugExists(slug, excludeId) {
  let q = supabase.from('products').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  const rows = unwrap(await q)
  return rows.length > 0
}

/** Only the columns that live on the products table. */
function pickProductColumns(input) {
  const allowed = [
    'slug',
    'name',
    'category_id',
    'brand',
    'style_number',
    'short_description',
    'description',
    'base_price',
    'price_unit',
    'min_quantity',
    'decoration_methods',
    'print_locations',
    'features',
    'badges',
    'specs',
    'images',
    'is_featured',
    'featured_order',
    'is_active',
  ]
  const out = {}
  for (const key of allowed) {
    if (key in input) out[key] = input[key]
  }
  if ('category_id' in out && !out.category_id) out.category_id = null
  if ('base_price' in out) out.base_price = out.base_price === '' || out.base_price === null ? 0 : Number(out.base_price)
  if ('min_quantity' in out) out.min_quantity = Number(out.min_quantity) || 1
  if ('featured_order' in out) out.featured_order = out.featured_order === '' ? null : Number(out.featured_order)
  return out
}

export async function createProduct(input) {
  const data = unwrap(await supabase.from('products').insert(pickProductColumns(input)).select('*').single())
  await logActivity('created', 'product', data.id, data.name)
  return data
}

export async function updateProduct(id, input) {
  const data = unwrap(
    await supabase
      .from('products')
      .update({ ...pickProductColumns(input), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single(),
  )
  await logActivity('updated', 'product', id, data.name)
  return data
}

export async function deleteProduct(id, name) {
  unwrap(await supabase.from('products').delete().eq('id', id))
  await logActivity('deleted', 'product', id, name)
}

export async function toggleProductActive(id, is_active, name) {
  const data = unwrap(
    await supabase.from('products').update({ is_active }).eq('id', id).select('id, is_active, name').single(),
  )
  await logActivity(is_active ? 'activated' : 'deactivated', 'product', id, name || data.name)
  return data
}

/**
 * Replace the variant set for a product: upsert rows with ids, insert new ones, delete removed ones.
 * @param {string} productId
 * @param {Array} variants rows with optional id
 */
export async function upsertVariants(productId, variants) {
  const existing = unwrap(await supabase.from('product_variants').select('id').eq('product_id', productId))
  const keepIds = new Set(variants.filter((v) => v.id).map((v) => v.id))
  const toDelete = existing.map((r) => r.id).filter((id) => !keepIds.has(id))
  if (toDelete.length) unwrap(await supabase.from('product_variants').delete().in('id', toDelete))

  const rows = variants.map((v, i) => {
    const row = {
      product_id: productId,
      sku: v.sku?.trim() || null,
      color_name: v.color_name?.trim() || 'Untitled',
      color_hex: v.color_hex || null,
      size: v.size || null,
      price_adjustment: Number(v.price_adjustment) || 0,
      image_url: v.image_url || null,
      in_stock: v.in_stock !== false,
      sort_order: i,
    }
    if (v.id) row.id = v.id
    return row
  })
  if (!rows.length) return []
  return unwrap(await supabase.from('product_variants').upsert(rows, { onConflict: 'id' }).select('*'))
}

export async function upsertTiers(productId, tiers) {
  const existing = unwrap(await supabase.from('pricing_tiers').select('id').eq('product_id', productId))
  const keepIds = new Set(tiers.filter((t) => t.id).map((t) => t.id))
  const toDelete = existing.map((r) => r.id).filter((id) => !keepIds.has(id))
  if (toDelete.length) unwrap(await supabase.from('pricing_tiers').delete().in('id', toDelete))

  const rows = tiers.map((t) => {
    const row = {
      product_id: productId,
      min_qty: parseInt(t.min_qty, 10) || 1,
      max_qty: t.max_qty === '' || t.max_qty === null || t.max_qty === undefined ? null : parseInt(t.max_qty, 10),
      unit_price: Number(t.unit_price) || 0,
    }
    if (t.id) row.id = t.id
    return row
  })
  if (!rows.length) return []
  return unwrap(await supabase.from('pricing_tiers').upsert(rows, { onConflict: 'id' }).select('*'))
}

export async function listDecorationOptions() {
  return unwrap(
    await supabase
      .from('decoration_options')
      .select('id, key, name, description, setup_fee, per_location_fee, sort_order, is_active')
      .order('sort_order'),
  )
}

export async function countProducts() {
  const { count, error } = await supabase.from('products').select('id', { count: 'exact', head: true })
  if (error) throw new Error(error.message)
  return count || 0
}
