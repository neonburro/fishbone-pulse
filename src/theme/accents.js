// src/theme/accents.js
//
// The ink shelf. Four accent colors the visitor can pick from in the footer,
// next to Ink and Bone. Registration red is the default and the brand, the
// other three are there because a print shop has more than one can open.
// Each one carries its own text color for buttons so nothing ever goes
// black on red or bone on yellow.
//
// The theme reads the accent through CSS variables (--fb-red-50 to 900 and
// --fb-on-red), so switching is one attribute change and no re-render of
// the theme. applyAccent() writes the variables on <html>. The default
// values are also baked into the global styles so the first paint is right
// before any JavaScript runs.
//
// Pulse has a copy of this list in src/theme/accents.js for its Design tab.
// Change both or the shop will pick a color the site does not know.

export const ACCENTS = [
  { key: 'red', name: 'Registration red', note: 'The default. The eye, the Instagram avatar, a hair more vintage.', base: '#E0293F', on: '#FBF8F2' },
  { key: 'cantaloupe', name: 'Cantaloupe', note: 'The fruit one. Ink type on it.', base: '#EE7A4B', on: '#161618' },
  { key: 'moss', name: 'Moss', note: 'The nature one. Looks like a shirt on the wall.', base: '#7C8C5E', on: '#FBF8F2' },
  { key: 'process', name: 'Process blue', note: 'The print joke. Cyan with the volume down.', base: '#2F8FB0', on: '#FBF8F2' },
]
export const DEFAULT_ACCENT = 'red'
export const ACCENT_STORAGE = 'fb-accent'

const hex = (h) => { const s = h.replace('#', ''); const n = parseInt(s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()
const mix = (a, b, t) => { const [r1, g1, b1] = hex(a); const [r2, g2, b2] = hex(b); return toHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t) }

/** A ten stop scale from one base. 500 is the base, lighter toward bone, darker toward ink. */
export function scaleFrom(base) {
  return {
    50: mix(base, '#FBF8F2', 0.88), 100: mix(base, '#FBF8F2', 0.72), 200: mix(base, '#FBF8F2', 0.5), 300: mix(base, '#FBF8F2', 0.3), 400: mix(base, '#FBF8F2', 0.12),
    500: base, 600: mix(base, '#161618', 0.14), 700: mix(base, '#161618', 0.32), 800: mix(base, '#161618', 0.5), 900: mix(base, '#161618', 0.68),
  }
}

export function accentByKey(key) {
  return ACCENTS.find((a) => a.key === key) || ACCENTS[0]
}

/** CSS custom properties for one accent, as an object you can spread into a style block. */
export function accentVars(key) {
  const a = accentByKey(key)
  const s = scaleFrom(a.base)
  const out = { '--fb-on-red': a.on }
  for (const k of Object.keys(s)) out[`--fb-red-${k}`] = s[k]
  return out
}

/** Write the accent onto <html>. Safe to call before React mounts. */
export function applyAccent(key) {
  if (typeof document === 'undefined') return
  const vars = accentVars(key)
  const el = document.documentElement
  for (const k of Object.keys(vars)) el.style.setProperty(k, vars[k])
  el.setAttribute('data-accent', accentByKey(key).key)
}

export function readStoredAccent() {
  try { return localStorage.getItem(ACCENT_STORAGE) || '' } catch { return '' }
}
export function storeAccent(key) {
  try { localStorage.setItem(ACCENT_STORAGE, key) } catch { /* private mode, fine */ }
}
