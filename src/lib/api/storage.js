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

const SHOWCASE_BUCKET = 'showcase'
const JOURNAL_BUCKET = 'journal'

function extOf(file) {
  const fromName = (file.name || '').split('.').pop()?.toLowerCase()
  if (fromName && fromName.length <= 5 && fromName !== file.name) return fromName
  return (file.type || '').split('/')[1] || 'jpg'
}

/** Read natural width/height of an image file in the browser. */
export function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve({ width: null, height: null })
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

/** Showcase image -> public 'showcase' bucket at <placement>/<uuid>.<ext>. Returns path, url, width, height. */
export async function uploadShowcaseImage(file, placement = 'home') {
  if (!file?.type?.startsWith('image/')) throw new Error('Only image files can be added to the showcase')
  if (file.size > 12 * 1024 * 1024) throw new Error('Showcase images must be under 12 MB')
  const path = `${placement}/${crypto.randomUUID()}.${extOf(file)}`
  const [{ width, height }] = await Promise.all([
    readImageSize(file),
    (async () => unwrap(await supabase.storage.from(SHOWCASE_BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type })))(),
  ])
  return { path, url: publicUrl(SHOWCASE_BUCKET, path), width, height }
}

export async function removeShowcaseImage(path) {
  if (!path) return
  const { error } = await supabase.storage.from(SHOWCASE_BUCKET).remove([path])
  if (error) console.warn('storage: showcase remove failed', error)
}

/** Journal cover -> public 'journal' bucket at covers/<uuid>.<ext>. */
export async function uploadJournalCover(file) {
  if (!file?.type?.startsWith('image/')) throw new Error('Only image files can be used as a cover')
  if (file.size > 12 * 1024 * 1024) throw new Error('Cover images must be under 12 MB')
  const path = `covers/${crypto.randomUUID()}.${extOf(file)}`
  unwrap(await supabase.storage.from(JOURNAL_BUCKET).upload(path, file, { cacheControl: '31536000', upsert: false, contentType: file.type }))
  return { path, url: publicUrl(JOURNAL_BUCKET, path) }
}
