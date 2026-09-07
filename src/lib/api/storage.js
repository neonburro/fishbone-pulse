import { supabase, unwrap } from '../supabase'

const PRODUCT_BUCKET = 'product-images'
const ARTWORK_BUCKET = 'artwork'
const SITE_BUCKET = 'site-media'

function safeName(name = 'file') {
  return String(name)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)
}

export function publicUrl(bucket, path) {
  if (!path) return null
  const {
    data: { publicUrl: url },
  } = supabase.storage.from(bucket).getPublicUrl(path)
  return url
}

/**
 * Upload a product (or variant) image. Path: products/<productId>/<timestamp>-<name>
 * @returns {{ path: string, url: string }}
 */
export async function uploadProductImage(file, productId = 'unassigned') {
  if (!file) throw new Error('No file selected')
  if (!file.type?.startsWith('image/')) throw new Error('Only image files can be uploaded here')
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be under 8 MB')
  const path = `products/${productId}/${Date.now()}-${safeName(file.name)}`
  unwrap(
    await supabase.storage.from(PRODUCT_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    }),
  )
  return { path, url: publicUrl(PRODUCT_BUCKET, path) }
}

/** Upload a category / site image to site-media. Path: categories/<key>/<ts>-<name> */
export async function uploadSiteImage(file, folder = 'misc') {
  if (!file) throw new Error('No file selected')
  if (!file.type?.startsWith('image/')) throw new Error('Only image files can be uploaded here')
  if (file.size > 8 * 1024 * 1024) throw new Error('Images must be under 8 MB')
  const path = `${folder}/${Date.now()}-${safeName(file.name)}`
  unwrap(
    await supabase.storage.from(SITE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    }),
  )
  return { path, url: publicUrl(SITE_BUCKET, path) }
}

/** Remove a product image by storage path (ignores failures for external URLs). */
export async function removeProductImage(path) {
  if (!path || /^https?:\/\//i.test(path)) return
  const { error } = await supabase.storage.from(PRODUCT_BUCKET).remove([path])
  if (error) console.warn('storage: remove failed', error)
}

/** Signed URL for private customer artwork (1 hour). */
export async function signedArtworkUrl(path, expiresIn = 3600) {
  if (!path) throw new Error('Artwork path is missing')
  const data = unwrap(await supabase.storage.from(ARTWORK_BUCKET).createSignedUrl(path, expiresIn))
  return data.signedUrl
}

/** Convert a public product-images URL back to a storage path (for removal). */
export function storagePathFromUrl(url) {
  if (!url) return null
  const marker = `/object/public/${PRODUCT_BUCKET}/`
  const idx = url.indexOf(marker)
  return idx === -1 ? null : decodeURIComponent(url.slice(idx + marker.length))
}
