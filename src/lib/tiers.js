/** Pricing tier helpers shared by the editor and the product form. */
export const emptyTier = (min = 1) => ({
  _key: `t-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  min_qty: min,
  max_qty: '',
  unit_price: '',
})

/** Returns an array of human-readable problems; empty when the tier set is valid. */
export function validateTiers(tiers) {
  const problems = []
  const sorted = [...tiers].map((t, i) => ({ ...t, _i: i })).sort((a, b) => (parseInt(a.min_qty, 10) || 0) - (parseInt(b.min_qty, 10) || 0))
  sorted.forEach((t, idx) => {
    const min = parseInt(t.min_qty, 10)
    const max = t.max_qty === '' || t.max_qty === null || t.max_qty === undefined ? null : parseInt(t.max_qty, 10)
    const price = parseFloat(t.unit_price)
    if (!min || min < 1) problems.push(`Row ${t._i + 1}: minimum quantity must be at least 1.`)
    if (max !== null && (Number.isNaN(max) || max < min)) problems.push(`Row ${t._i + 1}: maximum must be blank or at least the minimum.`)
    if (Number.isNaN(price) || price < 0) problems.push(`Row ${t._i + 1}: unit price is required.`)
    const next = sorted[idx + 1]
    if (next) {
      const nextMin = parseInt(next.min_qty, 10)
      if (max === null) problems.push(`Row ${t._i + 1}: only the last tier can have an open-ended maximum.`)
      else if (nextMin <= max) problems.push(`Rows ${t._i + 1} and ${next._i + 1} overlap (${min}–${max} vs ${nextMin}+).`)
      else if (nextMin !== max + 1) problems.push(`Gap between ${max} and ${nextMin}: quantities in between have no price.`)
    }
  })
  return [...new Set(problems)]
}
