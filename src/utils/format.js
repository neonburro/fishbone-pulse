import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns'

function toDate(value) {
  if (!value) return null
  const d = typeof value === 'string' ? parseISO(value) : new Date(value)
  return isValid(d) ? d : null
}

export function formatDate(value, pattern = 'MMM d, yyyy') {
  const d = toDate(value)
  return d ? format(d, pattern) : '—'
}

export function formatDateTime(value) {
  const d = toDate(value)
  return d ? format(d, 'MMM d, yyyy · h:mm a') : '—'
}

export function timeAgo(value) {
  const d = toDate(value)
  return d ? formatDistanceToNow(d, { addSuffix: true }) : '—'
}

/** 'pending_review' -> 'Pending review' */
export function humanize(value) {
  if (!value) return ''
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
}

/** 'Ridgway Festival Tee!' -> 'ridgway-festival-tee' */
export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export function formatBytes(bytes) {
  const n = Number(bytes)
  if (!n || Number.isNaN(n)) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export function pluralize(count, singular, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

/** Sum of a size_breakdown object {S: 5, M: 10} */
export function sizeBreakdownTotal(breakdown) {
  if (!breakdown || typeof breakdown !== 'object') return 0
  return Object.values(breakdown).reduce((acc, v) => acc + (parseInt(v, 10) || 0), 0)
}

export function initials(name = '') {
  return String(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

/** Apparel size ordering for breakdown chips and tickets. */
const SIZE_ORDER = ['XS', 'S', 'M', 'L', 'XL', '2XL', 'XXL', '3XL', 'XXXL', '4XL', '5XL', 'OS', 'YS', 'YM', 'YL', 'YXL']

export function sortedSizes(breakdown) {
  return Object.entries(breakdown || {})
    .filter(([, qty]) => parseInt(qty, 10) > 0)
    .sort(([a], [b]) => {
      const ia = SIZE_ORDER.indexOf(a.toUpperCase())
      const ib = SIZE_ORDER.indexOf(b.toUpperCase())
      if (ia === -1 && ib === -1) return a.localeCompare(b)
      if (ia === -1) return 1
      if (ib === -1) return -1
      return ia - ib
    })
}
