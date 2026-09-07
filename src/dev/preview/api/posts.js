import * as fx from '../fixtures'
import { wait, clone, matches, newId } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')

const state = { posts: clone(fx.posts) }

export async function listPosts({ filter = 'all', search } = {}) {
  await wait()
  let rows = state.posts
  if (filter === 'published') rows = rows.filter((p) => p.is_published)
  if (filter === 'draft') rows = rows.filter((p) => !p.is_published)
  rows = rows.filter((p) => matches(search, p.title, p.slug, p.kicker))
  return clone([...rows].sort((a, b) => Number(b.is_pinned) - Number(a.is_pinned) || new Date(b.updated_at) - new Date(a.updated_at)))
}
export async function getPost(id) {
  await wait()
  return clone(state.posts.find((p) => p.id === id) || null)
}
export async function postSlugExists(slug, excludeId) {
  await wait(30)
  return state.posts.some((p) => p.slug === slug && p.id !== excludeId)
}
export async function createPost(input) {
  await wait()
  const p = { id: newId('post'), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...input }
  state.posts.push(p)
  return clone(p)
}
export async function updatePost(id, input) {
  await wait()
  const p = state.posts.find((x) => x.id === id)
  Object.assign(p, input, { updated_at: new Date().toISOString() })
  return clone(p)
}
export async function deletePost(id) {
  await wait()
  state.posts = state.posts.filter((p) => p.id !== id)
}
