import * as fx from '../fixtures'
import { wait, clone, newId } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')

export const PLACEMENTS = [
  { key: 'home', label: 'Home wall', help: 'The graphics wall on the storefront home page.' },
  { key: 'work', label: 'Work gallery', help: 'The /work gallery grid.' },
  { key: 'hero', label: 'Hero', help: 'Large hero images rotated at the top of the home page.' },
]

const state = { items: clone(fx.showcase) }

export async function listShowcase(placement) {
  await wait()
  return clone(state.items.filter((i) => !placement || placement === 'all' || i.placement === placement).sort((a, b) => a.sort_order - b.sort_order))
}
export async function countShowcase() {
  await wait()
  return state.items.filter((i) => i.is_active).length
}
export async function createShowcaseItem(input) {
  await wait()
  const item = { id: newId('sc'), is_active: true, tags: [], created_at: new Date().toISOString(), ...input }
  state.items.push(item)
  return clone(item)
}
export async function updateShowcaseItem(id, patch) {
  await wait(80)
  const it = state.items.find((x) => x.id === id)
  Object.assign(it, patch)
  return clone(it)
}
export async function deleteShowcaseItem(item) {
  await wait()
  state.items = state.items.filter((x) => x.id !== item.id)
}
export async function reorderShowcase(ordered) {
  await wait(50)
  ordered.forEach((o, i) => {
    const it = state.items.find((x) => x.id === o.id)
    if (it) it.sort_order = i
  })
}
