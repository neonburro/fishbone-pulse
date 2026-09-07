const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Format a numeric or string amount as USD. Null/undefined -> em dash. */
export function formatMoney(value, { dash = true } = {}) {
  if (value === null || value === undefined || value === '') return dash ? '—' : usd.format(0)
  const n = typeof value === 'number' ? value : parseFloat(value)
  if (Number.isNaN(n)) return dash ? '—' : usd.format(0)
  return usd.format(n)
}

/** Parse a user-typed money string into a number (2 decimals) or null. */
export function parseMoney(input) {
  if (input === null || input === undefined || input === '') return null
  const n = parseFloat(String(input).replace(/[^0-9.-]/g, ''))
  if (Number.isNaN(n)) return null
  return Math.round(n * 100) / 100
}

export function sumBy(items, key) {
  return (items || []).reduce((acc, item) => acc + (parseFloat(item?.[key]) || 0), 0)
}
