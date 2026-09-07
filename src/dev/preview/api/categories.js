import * as fx from '../fixtures'
import { wait, clone, newId } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const state = { categories: clone(fx.categories) }

export async function listCategories() {
  await wait()
  return clone([...state.categories].sort((a, b) => a.sort_order - b.sort_order))
}
export async function createCategory(input) {
  await wait()
  const c = { id: newId('cat'), is_active: true, sort_order: state.categories.length, ...input }
  state.categories.push(c)
  return clone(c)
}
export async function updateCategory(id, patch) {
  await wait()
  const c = state.categories.find((x) => x.id === id)
  Object.assign(c, patch)
  return clone(c)
}
export async function deleteCategory(id) {
  await wait()
  state.categories = state.categories.filter((c) => c.id !== id)
}
export async function reorderCategories(ordered) {
  await wait()
  ordered.forEach((o, i) => {
    const c = state.categories.find((x) => x.id === o.id)
    if (c) c.sort_order = i
  })
}
