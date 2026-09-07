if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')

/** Simulate a short network hop so skeletons are visible. */
export const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms))
export const clone = (v) => JSON.parse(JSON.stringify(v))
export const matches = (term, ...fields) => {
  const t = (term || '').trim().toLowerCase()
  if (!t) return true
  return fields.some((f) => String(f || '').toLowerCase().includes(t))
}
export const paginate = (rows, page = 1, pageSize = 25) => ({
  rows: rows.slice((page - 1) * pageSize, page * pageSize),
  count: rows.length,
  page,
  pageSize,
})
export const newId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`
