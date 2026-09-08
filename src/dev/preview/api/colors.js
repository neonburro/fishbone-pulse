// src/dev/preview/api/colors.js
import { wait, clone } from './_util'
const colors = [
  { id: 'c1', brand: 'Comfort Colors', style_number: '1717', color_name: 'Pepper', color_hex: '#3F3F3F', swatch_url: null, sort_order: 0 },
  { id: 'c2', brand: 'Comfort Colors', style_number: '1717', color_name: 'Blue Jean', color_hex: '#4E5D74', swatch_url: null, sort_order: 1 },
  { id: 'c3', brand: 'Comfort Colors', style_number: '1717', color_name: 'Ivory', color_hex: '#F1E5DC', swatch_url: null, sort_order: 2 },
  { id: 'c4', brand: 'Comfort Colors', style_number: '1717', color_name: 'Yam', color_hex: '#AD6533', swatch_url: null, sort_order: 3 },
  { id: 'c5', brand: 'Gildan', style_number: '5000', color_name: 'Black', color_hex: '#26252B', swatch_url: null, sort_order: 0 },
  { id: 'c6', brand: 'Gildan', style_number: '5000', color_name: 'Sport Grey', color_hex: '#BEC0CD', swatch_url: null, sort_order: 1 },
]
export async function listBlankColors({ brand, style_number } = {}) { await wait(); return clone(colors.filter((c) => (!brand || c.brand.toLowerCase() === brand.toLowerCase()) && (!style_number || c.style_number.toLowerCase() === String(style_number).toLowerCase()))) }
export async function listBlankStyles() { await wait(); return clone([{ brand: 'Comfort Colors', style_number: '1717' }, { brand: 'Gildan', style_number: '5000' }]) }
export async function ensureVariant() { await wait(); return 'var-preview' }
