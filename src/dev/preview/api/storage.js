import { wait } from './_util'
import { swatchImage } from '../fixtures'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader()
    r.onload = () => resolve(r.result)
    r.onerror = reject
    r.readAsDataURL(file)
  })

export function publicUrl(_bucket, path) {
  return path ? swatchImage('#26262B', path.split('/').pop()) : null
}
export async function uploadProductImage(file, productId = 'preview') {
  await wait(300)
  return { path: `products/${productId}/${Date.now()}-${file.name}`, url: await readAsDataUrl(file) }
}
export async function uploadSiteImage(file, folder = 'misc') {
  await wait(300)
  return { path: `${folder}/${Date.now()}-${file.name}`, url: await readAsDataUrl(file) }
}
export async function removeProductImage() {
  await wait(50)
}
export async function signedArtworkUrl(path) {
  await wait(200)
  return swatchImage('#FF6A13', path.split('/').pop())
}
export function storagePathFromUrl() {
  return null
}

export async function readImageSize(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => resolve({ width: null, height: null })
    img.src = url
  })
}
export async function uploadShowcaseImage(file, placement = 'home') {
  await wait(300)
  const [{ width, height }, url] = await Promise.all([readImageSize(file), readAsDataUrl(file)])
  return { path: `${placement}/${crypto.randomUUID()}.jpg`, url, width, height }
}
export async function removeShowcaseImage() {
  await wait(30)
}
export async function uploadJournalCover(file) {
  await wait(300)
  return { path: `covers/${crypto.randomUUID()}.jpg`, url: await readAsDataUrl(file) }
}
