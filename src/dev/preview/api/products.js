import * as fx from '../fixtures'
import { wait, clone, matches, paginate, newId } from './_util'

export { PRICE_UNITS } from '../../../lib/enums'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { products: clone(fx.products), variants: clone(fx.variants), tiers: clone(fx.tiers) }
const find = (id) => state.products.find((p) => p.id === id)
const withCategory = (p) => ({ ...p, category: fx.categories.find((c) => c.id === p.category_id) ? { id: p.category_id, name: fx.categories.find((c) => c.id === p.category_id).name, key: fx.categories.find((c) => c.id === p.category_id).key } : null, product_variants: [{ count: (state.variants[p.id] || []).length }] })

export async function listProducts({ search, categoryId, active, page = 1, pageSize = 60 } = {}) {
  await wait()
  let rows = state.products
  if (categoryId && categoryId !== 'all') rows = rows.filter((p) => p.category_id === categoryId)
  if (active === 'active') rows = rows.filter((p) => p.is_active)
  if (active === 'inactive') rows = rows.filter((p) => !p.is_active)
  rows = rows.filter((p) => matches(search, p.name, p.slug, p.brand, p.style_number)).sort((a, b) => a.name.localeCompare(b.name))
  return paginate(rows.map(withCategory), page, pageSize)
}
export async function searchProducts(term, limit = 8) {
  await wait()
  if (!term?.trim()) return []
  return clone(state.products.filter((p) => matches(term, p.name, p.slug, p.style_number)).slice(0, limit))
}
export async function getProduct(id) {
  await wait()
  const p = find(id)
  if (!p) return null
  return { ...clone(withCategory(p)), variants: clone(state.variants[id] || []), tiers: clone(state.tiers[id] || []) }
}
export async function slugExists(slug, excludeId) {
  await wait(30)
  return state.products.some((p) => p.slug === slug && p.id !== excludeId)
}
export async function createProduct(input) {
  await wait()
  const p = { id: newId('prod'), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...input }
  state.products.push(p)
  return clone(p)
}
export async function updateProduct(id, input) {
  await wait()
  Object.assign(find(id), input, { updated_at: new Date().toISOString() })
  return clone(find(id))
}
export async function deleteProduct(id) {
  await wait()
  state.products = state.products.filter((p) => p.id !== id)
}
export async function toggleProductActive(id, is_active) {
  await wait()
  find(id).is_active = is_active
  return clone(find(id))
}
export async function upsertVariants(productId, variants) {
  await wait()
  state.variants[productId] = variants.map((v, i) => ({ ...v, id: v.id || newId('var'), product_id: productId, sort_order: i }))
  return clone(state.variants[productId])
}
export async function upsertTiers(productId, tiers) {
  await wait()
  state.tiers[productId] = tiers.map((t) => ({ ...t, id: t.id || newId('tier'), product_id: productId, max_qty: t.max_qty === '' ? null : t.max_qty }))
  return clone(state.tiers[productId])
}
export async function listDecorationOptions() {
  await wait()
  return clone(fx.decorationOptions)
}
export async function countProducts() {
  await wait()
  return state.products.length
}
