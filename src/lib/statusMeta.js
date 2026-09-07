/** Label + palette per enum value, shared by badges, selects and the job ticket. */
export const ORDER_STATUS_META = {
  pending_review: { label: 'Needs review', bg: 'ember.100', color: 'ember.800', dot: 'ember.500' },
  quoted: { label: 'Quoted', bg: 'bone.200', color: 'ink.700', dot: 'ink.500' },
  awaiting_payment: { label: 'Awaiting payment', bg: 'yellow.100', color: 'yellow.800', dot: 'yellow.500' },
  paid: { label: 'Paid', bg: 'river.100', color: 'river.800', dot: 'river.500' },
  in_production: { label: 'In production', bg: 'blue.100', color: 'blue.800', dot: 'blue.500' },
  ready_for_pickup: { label: 'Ready for pickup', bg: 'hivis.100', color: 'hivis.900', dot: 'hivis.500' },
  shipped: { label: 'Shipped', bg: 'purple.100', color: 'purple.800', dot: 'purple.500' },
  completed: { label: 'Completed', bg: 'green.100', color: 'green.800', dot: 'green.500' },
  cancelled: { label: 'Cancelled', bg: 'red.100', color: 'red.800', dot: 'red.500' },
}

export const PAYMENT_STATUS_META = {
  unpaid: { label: 'Unpaid', bg: 'bone.200', color: 'ink.700' },
  pending: { label: 'Pending', bg: 'yellow.100', color: 'yellow.800' },
  paid: { label: 'Paid', bg: 'green.100', color: 'green.800' },
  partially_refunded: { label: 'Part. refunded', bg: 'orange.100', color: 'orange.800' },
  refunded: { label: 'Refunded', bg: 'red.100', color: 'red.800' },
  failed: { label: 'Failed', bg: 'red.100', color: 'red.800' },
}

export const QUOTE_STATUS_META = {
  new: { label: 'New', bg: 'ember.100', color: 'ember.800', dot: 'ember.500' },
  contacted: { label: 'Contacted', bg: 'blue.100', color: 'blue.800' },
  quoted: { label: 'Quoted', bg: 'river.100', color: 'river.800' },
  won: { label: 'Won', bg: 'green.100', color: 'green.800' },
  lost: { label: 'Lost', bg: 'bone.200', color: 'ink.700' },
}
