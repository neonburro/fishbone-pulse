import { supabase, unwrap } from '../supabase'
import { logActivity } from '../../utils/activityLogger'

const LIST_COLS = 'id, slug, title, kicker, excerpt, cover_image_url, tags, author_name, is_published, published_at, is_pinned, created_at, updated_at'

export async function listPosts({ filter = 'all', search } = {}) {
  let q = supabase.from('posts').select(LIST_COLS).order('is_pinned', { ascending: false }).order('published_at', { ascending: false, nullsFirst: true }).order('updated_at', { ascending: false })
  if (filter === 'published') q = q.eq('is_published', true)
  if (filter === 'draft') q = q.eq('is_published', false)
  const term = (search || '').trim()
  if (term) {
    const like = `%${term.replace(/[%_]/g, '\\$&')}%`
    q = q.or(`title.ilike.${like},slug.ilike.${like},kicker.ilike.${like}`)
  }
  return unwrap(await q)
}

export async function getPost(id) {
  return unwrap(await supabase.from('posts').select('*').eq('id', id).maybeSingle())
}

export async function postSlugExists(slug, excludeId) {
  let q = supabase.from('posts').select('id').eq('slug', slug).limit(1)
  if (excludeId) q = q.neq('id', excludeId)
  return unwrap(await q).length > 0
}

function pick(input) {
  const allowed = ['slug', 'title', 'kicker', 'excerpt', 'body', 'cover_image_path', 'cover_image_url', 'cover_alt', 'tags', 'author_id', 'author_name', 'is_published', 'published_at', 'is_pinned']
  const out = {}
  for (const k of allowed) if (k in input) out[k] = input[k]
  return out
}

export async function createPost(input) {
  const data = unwrap(await supabase.from('posts').insert(pick(input)).select('*').single())
  await logActivity('created', 'post', data.id, data.title)
  return data
}

export async function updatePost(id, input) {
  const data = unwrap(
    await supabase
      .from('posts')
      .update({ ...pick(input), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single(),
  )
  await logActivity('updated', 'post', id, data.title, { published: data.is_published })
  return data
}

export async function deletePost(id, title) {
  unwrap(await supabase.from('posts').delete().eq('id', id))
  await logActivity('deleted', 'post', id, title)
}
