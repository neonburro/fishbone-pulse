/** Postgres enum values and fixed option lists shared across the app. */
export const ORDER_STATUSES = [
  'pending_review',
  'quoted',
  'awaiting_payment',
  'paid',
  'in_production',
  'ready_for_pickup',
  'shipped',
  'completed',
  'cancelled',
]

export const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'partially_refunded', 'refunded', 'failed']

export const PAYMENT_PROVIDERS = ['invoice', 'stripe', 'square']

export const QUOTE_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost']

export const PRICE_UNITS = ['each', 'per dozen', 'per set', 'per sq ft']

export const PAGE_SIZE = 25
