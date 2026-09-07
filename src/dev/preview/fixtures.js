/**
 * DEVELOPMENT-ONLY fixture data for layout review (VITE_PULSE_PREVIEW=1 with `vite` dev server).
 * These modules are swapped in through a Vite alias in vite.config.js and are never part of a
 * production build. Nothing in src/lib or src/pages imports this file.
 */
if (!import.meta.env.DEV) {
  throw new Error('Fishbone Pulse preview fixtures are development-only and must never ship.')
}

const daysAgo = (n, h = 10) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  d.setHours(h, 24, 0, 0)
  return d.toISOString()
}
const daysAhead = (n) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

/** Inline SVG placeholder so previews work with no network. */
export const swatchImage = (hex, label = '') =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="${hex}"/><circle cx="200" cy="200" r="120" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="6"/><path d="M200 40v320M40 200h320" stroke="rgba(255,255,255,0.35)" stroke-width="6"/><text x="200" y="370" font-family="monospace" font-size="22" fill="rgba(255,255,255,0.7)" text-anchor="middle">${label}</text></svg>`,
  )}`

export const categories = [
  { id: 'cat-tees', key: 'tees', name: 'Tees', tagline: 'Heavyweight, ring-spun and tri-blend blanks that take ink well', description: null, image_url: swatchImage('#26262B', 'TEES'), sort_order: 0, is_active: true, products: [{ count: 2 }] },
  { id: 'cat-fleece', key: 'hoodies-fleece', name: 'Hoodies & Fleece', tagline: 'Cold-morning layers for the festival lot', description: null, image_url: swatchImage('#1A736A', 'FLEECE'), sort_order: 1, is_active: true, products: [{ count: 1 }] },
  { id: 'cat-hats', key: 'hats', name: 'Hats', tagline: 'Trucker caps, beanies and dad hats', description: null, image_url: swatchImage('#8F3707', 'HATS'), sort_order: 2, is_active: true, products: [{ count: 1 }] },
  { id: 'cat-festival', key: 'festival-merch', name: 'Festival Merch', tagline: 'Tour-grade runs for the Telluride, Ridgway and Ouray circuit', description: null, image_url: swatchImage('#FF6A13', 'FEST'), sort_order: 3, is_active: true, products: [{ count: 1 }] },
  { id: 'cat-posters', key: 'posters-prints', name: 'Posters & Prints', tagline: 'Hand-pulled gig posters on French Paper', description: null, image_url: null, sort_order: 4, is_active: false, products: [{ count: 0 }] },
]

export const decorationOptions = [
  { id: 'deco-1', key: 'screen_print', name: 'Screen printing', description: 'Plastisol or water-based, up to 6 spot colors per location', setup_fee: 25, per_location_fee: 1.5, sort_order: 0, is_active: true },
  { id: 'deco-2', key: 'embroidery', name: 'Embroidery', description: 'Up to 10,000 stitches included', setup_fee: 45, per_location_fee: 3, sort_order: 1, is_active: true },
  { id: 'deco-3', key: 'dtf', name: 'DTF transfer', description: 'Full-color, small runs, photographic art', setup_fee: 0, per_location_fee: 2.5, sort_order: 2, is_active: true },
]

const productBase = {
  is_active: true,
  is_featured: false,
  featured_order: null,
  updated_at: daysAgo(1),
  created_at: daysAgo(40),
}

export const products = [
  {
    ...productBase,
    id: 'prod-1',
    slug: 'comfort-colors-1717-heavyweight-tee',
    name: 'Comfort Colors 1717 Heavyweight Tee',
    category_id: 'cat-tees',
    brand: 'Comfort Colors',
    style_number: '1717',
    short_description: 'Garment-dyed 6.1 oz cotton with that lived-in festival feel.',
    description:
      'The festival standard. 6.1 oz ring-spun cotton, garment-dyed for soft hand and muted color. Prints beautifully with water-based and discharge inks. Relaxed fit, runs slightly large.\n\nSizes S through 3XL. Minimum 12 pieces per design, mixed sizes are fine.',
    base_price: 14.5,
    price_unit: 'each',
    min_quantity: 12,
    decoration_methods: ['screen_print', 'dtf'],
    print_locations: ['Front', 'Back', 'Left chest', 'Left sleeve'],
    features: ['6.1 oz ring-spun cotton', 'Garment-dyed', 'Twill-taped neck and shoulders', 'Double-needle hems'],
    badges: ['Best seller', 'Festival favorite'],
    specs: { sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'], weight: '6.1 oz' },
    images: [
      { url: swatchImage('#4A4741', 'PEPPER'), alt: 'Comfort Colors 1717 in Pepper' },
      { url: swatchImage('#B8B0A2', 'IVORY'), alt: 'Comfort Colors 1717 in Ivory' },
      { url: swatchImage('#2BB3A3', 'SEAFOAM'), alt: 'Comfort Colors 1717 in Seafoam' },
    ],
    is_featured: true,
    featured_order: 1,
    category: { id: 'cat-tees', name: 'Tees', key: 'tees' },
    product_variants: [{ count: 4 }],
  },
  {
    ...productBase,
    id: 'prod-2',
    slug: 'bella-canvas-3001-unisex-jersey-tee',
    name: 'Bella+Canvas 3001 Unisex Jersey Tee',
    category_id: 'cat-tees',
    brand: 'Bella+Canvas',
    style_number: '3001',
    short_description: 'Retail-fit 4.2 oz Airlume cotton. Soft, light, great for detailed art.',
    description: 'A lighter, more fitted tee for bands and brands that want a retail silhouette.',
    base_price: 11.75,
    price_unit: 'each',
    min_quantity: 12,
    decoration_methods: ['screen_print', 'dtf'],
    print_locations: ['Front', 'Back', 'Left chest'],
    features: ['4.2 oz Airlume combed cotton', 'Side-seamed', 'Tear-away label'],
    badges: [],
    specs: { sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'] },
    images: [{ url: swatchImage('#0B0B0C', 'BLACK'), alt: 'Bella+Canvas 3001 in Black' }],
    category: { id: 'cat-tees', name: 'Tees', key: 'tees' },
    product_variants: [{ count: 3 }],
  },
  {
    ...productBase,
    id: 'prod-3',
    slug: 'gildan-18500-heavy-blend-hoodie',
    name: 'Gildan 18500 Heavy Blend Hoodie',
    category_id: 'cat-fleece',
    brand: 'Gildan',
    style_number: '18500',
    short_description: '8 oz 50/50 fleece. The workhorse hoodie for crews and school runs.',
    description: 'Warm, affordable, prints clean. Pouch pocket, double-lined hood, matching drawcord.',
    base_price: 24,
    price_unit: 'each',
    min_quantity: 12,
    decoration_methods: ['screen_print', 'embroidery'],
    print_locations: ['Front', 'Back', 'Left chest', 'Hood'],
    features: ['8.0 oz 50/50 cotton-poly', 'Double-lined hood', 'Pouch pocket'],
    badges: ['Heavyweight'],
    specs: { sizes: ['S', 'M', 'L', 'XL', '2XL', '3XL'] },
    images: [{ url: swatchImage('#1C1C1F', 'CHARCOAL'), alt: 'Gildan 18500 in Charcoal' }],
    is_featured: true,
    featured_order: 2,
    category: { id: 'cat-fleece', name: 'Hoodies & Fleece', key: 'hoodies-fleece' },
    product_variants: [{ count: 2 }],
  },
  {
    ...productBase,
    id: 'prod-4',
    slug: 'richardson-112-trucker-cap',
    name: 'Richardson 112 Trucker Cap',
    category_id: 'cat-hats',
    brand: 'Richardson',
    style_number: '112',
    short_description: 'The trucker. Embroidered or patched, one size fits most.',
    description: 'Structured mid-profile trucker with mesh back and snapback closure.',
    base_price: 16,
    price_unit: 'each',
    min_quantity: 24,
    decoration_methods: ['embroidery'],
    print_locations: ['Front', 'Left side', 'Back'],
    features: ['Structured mid-profile', 'Mesh back', 'Snapback'],
    badges: [],
    specs: { sizes: [] },
    images: [{ url: swatchImage('#8F3707', 'RUST'), alt: 'Richardson 112 Trucker Cap' }],
    category: { id: 'cat-hats', name: 'Hats', key: 'hats' },
    product_variants: [{ count: 3 }],
  },
  {
    ...productBase,
    id: 'prod-5',
    slug: 'festival-crew-tee-program',
    name: 'Festival Crew Tee Program',
    category_id: 'cat-festival',
    brand: null,
    style_number: null,
    short_description: 'Staff, volunteer and security tees in hi-vis colors, sized by role.',
    description: 'Bundle pricing for festival operations. Pick a blank, we handle color-coding by role.',
    base_price: 13,
    price_unit: 'each',
    min_quantity: 48,
    decoration_methods: ['screen_print'],
    print_locations: ['Front', 'Back'],
    features: ['Role color-coding', 'Consolidated size runs', 'Delivery to the festival grounds'],
    badges: ['Festival favorite'],
    specs: { sizes: ['S', 'M', 'L', 'XL', '2XL'] },
    images: [],
    is_active: false,
    category: { id: 'cat-festival', name: 'Festival Merch', key: 'festival-merch' },
    product_variants: [{ count: 0 }],
  },
]

export const variants = {
  'prod-1': [
    { id: 'var-1a', product_id: 'prod-1', sku: 'CC1717-PEP', color_name: 'Pepper', color_hex: '#4A4741', size: null, price_adjustment: 0, image_url: swatchImage('#4A4741'), in_stock: true, sort_order: 0 },
    { id: 'var-1b', product_id: 'prod-1', sku: 'CC1717-IVY', color_name: 'Ivory', color_hex: '#EDE6D6', size: null, price_adjustment: -0.5, image_url: null, in_stock: true, sort_order: 1 },
    { id: 'var-1c', product_id: 'prod-1', sku: 'CC1717-SEA', color_name: 'Seafoam', color_hex: '#8EDDD4', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 2 },
    { id: 'var-1d', product_id: 'prod-1', sku: 'CC1717-CRM', color_name: 'Crimson', color_hex: '#8B1E2D', size: null, price_adjustment: 0, image_url: null, in_stock: false, sort_order: 3 },
  ],
  'prod-2': [
    { id: 'var-2a', product_id: 'prod-2', sku: 'BC3001-BLK', color_name: 'Black', color_hex: '#0B0B0C', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 0 },
    { id: 'var-2b', product_id: 'prod-2', sku: 'BC3001-WHT', color_name: 'White', color_hex: '#FFFFFF', size: null, price_adjustment: -0.75, image_url: null, in_stock: true, sort_order: 1 },
    { id: 'var-2c', product_id: 'prod-2', sku: 'BC3001-HTHR', color_name: 'Athletic Heather', color_hex: '#9A9A9A', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 2 },
  ],
  'prod-3': [
    { id: 'var-3a', product_id: 'prod-3', sku: 'G185-CHR', color_name: 'Charcoal', color_hex: '#1C1C1F', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 0 },
    { id: 'var-3b', product_id: 'prod-3', sku: 'G185-FOR', color_name: 'Forest Green', color_hex: '#1F4D3A', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 1 },
  ],
  'prod-4': [
    { id: 'var-4a', product_id: 'prod-4', sku: 'R112-BLKWHT', color_name: 'Black / White', color_hex: '#0B0B0C', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 0 },
    { id: 'var-4b', product_id: 'prod-4', sku: 'R112-LODEN', color_name: 'Loden', color_hex: '#4F5A3C', size: null, price_adjustment: 0, image_url: null, in_stock: true, sort_order: 1 },
    { id: 'var-4c', product_id: 'prod-4', sku: 'R112-RUST', color_name: 'Rust / Khaki', color_hex: '#8F3707', size: null, price_adjustment: 1, image_url: null, in_stock: true, sort_order: 2 },
  ],
  'prod-5': [],
}

export const tiers = {
  'prod-1': [
    { id: 'tier-1a', product_id: 'prod-1', min_qty: 12, max_qty: 23, unit_price: 14.5 },
    { id: 'tier-1b', product_id: 'prod-1', min_qty: 24, max_qty: 47, unit_price: 12.75 },
    { id: 'tier-1c', product_id: 'prod-1', min_qty: 48, max_qty: 99, unit_price: 11.25 },
    { id: 'tier-1d', product_id: 'prod-1', min_qty: 100, max_qty: null, unit_price: 9.9 },
  ],
  'prod-2': [
    { id: 'tier-2a', product_id: 'prod-2', min_qty: 12, max_qty: 47, unit_price: 11.75 },
    { id: 'tier-2b', product_id: 'prod-2', min_qty: 48, max_qty: null, unit_price: 9.5 },
  ],
  'prod-3': [
    { id: 'tier-3a', product_id: 'prod-3', min_qty: 12, max_qty: 47, unit_price: 24 },
    { id: 'tier-3b', product_id: 'prod-3', min_qty: 48, max_qty: null, unit_price: 21 },
  ],
  'prod-4': [],
  'prod-5': [],
}

export const customers = [
  { id: 'cust-1', user_id: null, email: 'merch@telluridebluegrass.example', name: 'Dana Whitcomb', phone: '(970) 555-0142', company: 'Telluride Bluegrass Festival', notes: 'Wants PO number on every invoice. Ships to the fairgrounds office the week before.', created_at: daysAgo(400), orders: [{ count: 3 }] },
  { id: 'cust-2', user_id: null, email: 'ops@ourayicepark.example', name: 'Marcus Reyes', phone: '(970) 555-0177', company: 'Ouray Ice Park', notes: null, created_at: daysAgo(210), orders: [{ count: 1 }] },
  { id: 'cust-3', user_id: null, email: 'athletics@ridgwayschools.example', name: 'Jenna Ortiz', phone: '(970) 555-0110', company: 'Ridgway Secondary School', notes: 'Tax exempt — certificate on file.', created_at: daysAgo(150), orders: [{ count: 1 }] },
  { id: 'cust-4', user_id: null, email: 'kelsey.band@example.com', name: 'Kelsey Marlow', phone: null, company: 'The Uncompahgre Ramblers', notes: null, created_at: daysAgo(30), orders: [{ count: 1 }] },
  { id: 'cust-5', user_id: null, email: 'hello@sanjuanbrew.example', name: 'Tomas Hale', phone: '(970) 555-0199', company: 'San Juan Brewing', notes: null, created_at: daysAgo(12), orders: [{ count: 1 }] },
]

const contactOf = (c) => ({ name: c.name, email: c.email, phone: c.phone, company: c.company })

export const orders = [
  {
    id: 'ord-1',
    order_number: 'FB-26-01007',
    customer_id: 'cust-1',
    status: 'pending_review',
    payment_status: 'unpaid',
    payment_provider: 'invoice',
    payment_reference: null,
    contact: contactOf(customers[0]),
    fulfillment: 'ship',
    shipping_address: { name: 'Telluride Bluegrass — Merch Tent', line1: '500 W Colorado Ave', line2: 'Attn: Dana Whitcomb', city: 'Telluride', state: 'CO', zip: '81435', country: 'US' },
    subtotal: 3576,
    setup_fees: 75,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 3651,
    customer_notes: 'Same art as last year but swap the date to 2026. Please match the Seafoam from the 2025 run. We need these before load-in on the 17th.',
    internal_notes: 'Pull 2025 screens from archive rack B. Discharge white underbase on Pepper.',
    needed_by: daysAhead(9),
    source: 'storefront',
    created_at: daysAgo(0, 8),
    order_items: [{ count: 2 }],
  },
  {
    id: 'ord-2',
    order_number: 'FB-26-01006',
    customer_id: 'cust-5',
    status: 'awaiting_payment',
    payment_status: 'pending',
    payment_provider: 'invoice',
    payment_reference: 'INV-2026-118',
    contact: contactOf(customers[4]),
    fulfillment: 'pickup',
    shipping_address: null,
    subtotal: 1152,
    setup_fees: 45,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 1197,
    customer_notes: '',
    internal_notes: '',
    needed_by: daysAhead(14),
    source: 'storefront',
    created_at: daysAgo(1, 15),
    order_items: [{ count: 1 }],
  },
  {
    id: 'ord-3',
    order_number: 'FB-26-01005',
    customer_id: 'cust-3',
    status: 'in_production',
    payment_status: 'paid',
    payment_provider: 'invoice',
    payment_reference: 'CHK 4471',
    contact: contactOf(customers[2]),
    fulfillment: 'pickup',
    shipping_address: null,
    subtotal: 1008,
    setup_fees: 25,
    discount: 50,
    shipping: 0,
    tax: 0,
    total: 983,
    customer_notes: 'Volleyball season. Names on backs are on the attached sheet.',
    internal_notes: 'On press Thursday.',
    needed_by: daysAhead(4),
    source: 'storefront',
    created_at: daysAgo(6, 11),
    order_items: [{ count: 1 }],
  },
  {
    id: 'ord-4',
    order_number: 'FB-26-01004',
    customer_id: 'cust-2',
    status: 'ready_for_pickup',
    payment_status: 'paid',
    payment_provider: 'stripe',
    payment_reference: 'ch_3P9xK2',
    contact: contactOf(customers[1]),
    fulfillment: 'pickup',
    shipping_address: null,
    subtotal: 1440,
    setup_fees: 45,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 1485,
    customer_notes: '',
    internal_notes: 'Boxed. 3 boxes by the front counter.',
    needed_by: daysAhead(1),
    source: 'storefront',
    created_at: daysAgo(10, 9),
    order_items: [{ count: 1 }],
  },
  {
    id: 'ord-5',
    order_number: 'FB-26-01003',
    customer_id: 'cust-4',
    status: 'completed',
    payment_status: 'paid',
    payment_provider: 'square',
    payment_reference: 'SQ-77812',
    contact: contactOf(customers[3]),
    fulfillment: 'pickup',
    shipping_address: null,
    subtotal: 423,
    setup_fees: 25,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 448,
    customer_notes: 'Band merch for the Ridgway Concert Series. Tri-blend if you have it.',
    internal_notes: '',
    needed_by: null,
    source: 'storefront',
    created_at: daysAgo(21, 13),
    order_items: [{ count: 1 }],
  },
  {
    id: 'ord-6',
    order_number: 'FB-26-01002',
    customer_id: 'cust-1',
    status: 'cancelled',
    payment_status: 'unpaid',
    payment_provider: null,
    payment_reference: null,
    contact: contactOf(customers[0]),
    fulfillment: 'pickup',
    shipping_address: null,
    subtotal: 348,
    setup_fees: 25,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 373,
    customer_notes: 'Test order, please ignore.',
    internal_notes: 'Duplicate of 01007, cancelled per Dana.',
    needed_by: null,
    source: 'storefront',
    created_at: daysAgo(28, 16),
    order_items: [{ count: 1 }],
  },
  {
    id: 'ord-7',
    order_number: 'FB-26-01001',
    customer_id: 'cust-1',
    status: 'shipped',
    payment_status: 'paid',
    payment_provider: 'invoice',
    payment_reference: 'INV-2026-102',
    contact: contactOf(customers[0]),
    fulfillment: 'ship',
    shipping_address: { line1: '500 W Colorado Ave', city: 'Telluride', state: 'CO', zip: '81435', country: 'US' },
    subtotal: 990,
    setup_fees: 25,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 1015,
    customer_notes: '',
    internal_notes: 'UPS 1Z 999 AA1 01 2345 6784',
    needed_by: null,
    source: 'storefront',
    created_at: daysAgo(45, 10),
    order_items: [{ count: 1 }],
  },
]

export const orderItems = {
  'ord-1': [
    {
      id: 'item-1a', order_id: 'ord-1', product_id: 'prod-1', variant_id: 'var-1a', product_name: 'Comfort Colors 1717 Heavyweight Tee', variant_label: 'Pepper', sku: 'CC1717-PEP', quantity: 200, unit_price: 9.9, line_total: 1980, decoration_method: 'screen_print',
      print_locations: [{ key: 'front', name: 'Front', colors: 3 }, { key: 'back', name: 'Back', colors: 1 }],
      size_breakdown: { S: 20, M: 50, L: 60, XL: 45, '2XL': 20, '3XL': 5 },
      artwork_files: [
        { path: 'uploads/3f2a1c9e/tbf-2026-front.ai', name: 'tbf-2026-front.ai', size: 2481920, type: 'application/postscript' },
        { path: 'uploads/3f2a1c9e/tbf-2026-back.png', name: 'tbf-2026-back.png', size: 512340, type: 'image/png' },
      ],
      notes: 'Front: 3-color (bone, ember, teal). Back: single-color date block.',
    },
    {
      id: 'item-1b', order_id: 'ord-1', product_id: 'prod-1', variant_id: 'var-1c', product_name: 'Comfort Colors 1717 Heavyweight Tee', variant_label: 'Seafoam', sku: 'CC1717-SEA', quantity: 144, unit_price: 9.9, line_total: 1425.6, decoration_method: 'screen_print',
      print_locations: [{ key: 'front', name: 'Front', colors: 3 }],
      size_breakdown: { S: 18, M: 40, L: 44, XL: 30, '2XL': 12 },
      artwork_files: [{ path: 'uploads/3f2a1c9e/tbf-2026-front.ai', name: 'tbf-2026-front.ai', size: 2481920, type: 'application/postscript' }],
      notes: '',
    },
  ],
  'ord-2': [
    { id: 'item-2a', order_id: 'ord-2', product_id: 'prod-3', variant_id: 'var-3a', product_name: 'Gildan 18500 Heavy Blend Hoodie', variant_label: 'Charcoal', sku: 'G185-CHR', quantity: 48, unit_price: 24, line_total: 1152, decoration_method: 'embroidery', print_locations: [{ key: 'left_chest', name: 'Left chest' }], size_breakdown: { M: 12, L: 18, XL: 12, '2XL': 6 }, artwork_files: [{ path: 'uploads/9b7d22aa/sjb-logo.pdf', name: 'sjb-logo.pdf', size: 188211, type: 'application/pdf' }], notes: 'Taproom staff hoodies.' },
  ],
  'ord-3': [
    { id: 'item-3a', order_id: 'ord-3', product_id: 'prod-2', variant_id: 'var-2a', product_name: 'Bella+Canvas 3001 Unisex Jersey Tee', variant_label: 'Black', sku: 'BC3001-BLK', quantity: 96, unit_price: 10.5, line_total: 1008, decoration_method: 'screen_print', print_locations: ['front', 'back'], size_breakdown: { XS: 8, S: 24, M: 30, L: 22, XL: 12 }, artwork_files: [{ path: 'uploads/c1d0e5f4/demons-vb-2026.pdf', name: 'demons-vb-2026.pdf', size: 902100, type: 'application/pdf' }], notes: 'Names/numbers per attached roster.' },
  ],
  'ord-4': [
    { id: 'item-4a', order_id: 'ord-4', product_id: 'prod-4', variant_id: 'var-4b', product_name: 'Richardson 112 Trucker Cap', variant_label: 'Loden', sku: 'R112-LODEN', quantity: 90, unit_price: 16, line_total: 1440, decoration_method: 'embroidery', print_locations: [{ key: 'front', name: 'Front' }], size_breakdown: {}, artwork_files: [{ path: 'uploads/77e1a0b2/oip-mark.svg', name: 'oip-mark.svg', size: 18422, type: 'image/svg+xml' }], notes: '' },
  ],
  'ord-5': [
    { id: 'item-5a', order_id: 'ord-5', product_id: 'prod-2', variant_id: 'var-2c', product_name: 'Bella+Canvas 3001 Unisex Jersey Tee', variant_label: 'Athletic Heather', sku: 'BC3001-HTHR', quantity: 36, unit_price: 11.75, line_total: 423, decoration_method: 'screen_print', print_locations: ['front'], size_breakdown: { S: 8, M: 12, L: 10, XL: 6 }, artwork_files: [], notes: '' },
  ],
  'ord-6': [
    { id: 'item-6a', order_id: 'ord-6', product_id: 'prod-1', variant_id: 'var-1a', product_name: 'Comfort Colors 1717 Heavyweight Tee', variant_label: 'Pepper', sku: 'CC1717-PEP', quantity: 24, unit_price: 14.5, line_total: 348, decoration_method: 'screen_print', print_locations: ['front'], size_breakdown: { M: 12, L: 12 }, artwork_files: [], notes: '' },
  ],
  'ord-7': [
    { id: 'item-7a', order_id: 'ord-7', product_id: 'prod-1', variant_id: 'var-1b', product_name: 'Comfort Colors 1717 Heavyweight Tee', variant_label: 'Ivory', sku: 'CC1717-IVY', quantity: 100, unit_price: 9.9, line_total: 990, decoration_method: 'screen_print', print_locations: ['front', 'back'], size_breakdown: { S: 10, M: 30, L: 30, XL: 20, '2XL': 10 }, artwork_files: [], notes: '' },
  ],
}

export const orderEvents = {
  'ord-1': [
    { id: 'ev-1a', order_id: 'ord-1', actor_id: null, actor_label: 'Storefront', type: 'created', message: 'Order placed by customer', meta: {}, created_at: daysAgo(0, 8) },
    { id: 'ev-1b', order_id: 'ord-1', actor_id: 'admin-1', actor_label: 'Rae Fisher', type: 'note', message: 'Emailed Dana to confirm Seafoam match against the 2025 swatch.', meta: {}, created_at: daysAgo(0, 9) },
  ],
  'ord-2': [
    { id: 'ev-2a', order_id: 'ord-2', actor_id: null, actor_label: 'Storefront', type: 'created', message: 'Order placed by customer', meta: {}, created_at: daysAgo(1, 15) },
    { id: 'ev-2b', order_id: 'ord-2', actor_id: 'admin-1', actor_label: 'Rae Fisher', type: 'status_changed', message: 'Status changed from Needs review to Awaiting payment', meta: { from: 'pending_review', to: 'awaiting_payment' }, created_at: daysAgo(1, 17) },
  ],
  'ord-3': [
    { id: 'ev-3a', order_id: 'ord-3', actor_id: null, actor_label: 'Storefront', type: 'created', message: 'Order placed by customer', meta: {}, created_at: daysAgo(6, 11) },
    { id: 'ev-3b', order_id: 'ord-3', actor_id: 'admin-1', actor_label: 'Rae Fisher', type: 'status_changed', message: 'Status changed from Needs review to Awaiting payment', meta: {}, created_at: daysAgo(5, 10) },
    { id: 'ev-3c', order_id: 'ord-3', actor_id: 'admin-1', actor_label: 'Rae Fisher', type: 'status_changed', message: 'Status changed from Awaiting payment to Paid', meta: {}, created_at: daysAgo(3, 14) },
    { id: 'ev-3d', order_id: 'ord-3', actor_id: 'admin-2', actor_label: 'Joel Fisher', type: 'status_changed', message: 'Status changed from Paid to In production', meta: {}, created_at: daysAgo(1, 8) },
  ],
  'ord-4': [{ id: 'ev-4a', order_id: 'ord-4', actor_id: null, actor_label: 'Storefront', type: 'created', message: 'Order placed by customer', meta: {}, created_at: daysAgo(10, 9) }],
  'ord-5': [{ id: 'ev-5a', order_id: 'ord-5', actor_id: null, actor_label: 'Storefront', type: 'created', message: 'Order placed by customer', meta: {}, created_at: daysAgo(21, 13) }],
  'ord-6': [{ id: 'ev-6a', order_id: 'ord-6', actor_id: 'admin-1', actor_label: 'Rae Fisher', type: 'status_changed', message: 'Status changed from Needs review to Cancelled', meta: {}, created_at: daysAgo(27, 9) }],
  'ord-7': [{ id: 'ev-7a', order_id: 'ord-7', actor_id: 'admin-2', actor_label: 'Joel Fisher', type: 'status_changed', message: 'Status changed from In production to Shipped', meta: {}, created_at: daysAgo(38, 16) }],
}

export const quotes = [
  { id: 'q-1', name: 'Priya Natarajan', email: 'priya@ridgwayriverfest.example', phone: '(970) 555-0133', company: 'Ridgway RiverFest', event_name: 'RiverFest 2026', event_date: daysAhead(60), quantity_estimate: 400, product_interest: ['tees', 'hats', 'festival-merch'], description: 'Volunteer and vendor tees plus a small run of trucker caps for the merch booth. Art is mostly done, needs separations.', artwork_files: [{ path: 'uploads/aa11bb22/riverfest-logo.pdf', name: 'riverfest-logo.pdf', size: 402211, type: 'application/pdf' }], status: 'new', internal_notes: '', created_at: daysAgo(0, 7), request_type: 'festival', garment_interest: ['Comfort Colors 1717', 'Richardson 112'], decoration_interest: ['screen_print', 'embroidery'], colors_in_art: 3, print_locations: ['Front', 'Back'], sizes_estimate: 'Mostly M–XL, some youth', budget_range: '$3,000–$5,000', needed_by: daysAhead(45), delivery: 'ship', how_heard: 'Printed our 2024 tees', source_page: '/quote', reference_links: ['https://ridgwayriverfest.example/merch-2025'] },
  { id: 'q-2', name: 'Cole Brannigan', email: 'cole@example.com', phone: null, company: 'Log Hill Trail Crew', event_name: null, event_date: null, quantity_estimate: 30, product_interest: ['hoodies-fleece'], description: 'Crew hoodies, left chest embroidery, maybe a back print. Small run.', artwork_files: [], status: 'contacted', internal_notes: 'Sent Gildan 18500 pricing. Waiting on colors.', created_at: daysAgo(3, 12), request_type: 'business', garment_interest: ['Gildan 18500'], decoration_interest: ['embroidery'], colors_in_art: 1, print_locations: ['Left chest'], sizes_estimate: '', budget_range: 'Under $1,000', needed_by: null, delivery: 'pickup', how_heard: 'Instagram', source_page: '/quote', reference_links: [] },
  { id: 'q-3', name: 'Aimee Lund', email: 'aimee@mountainvillagemusic.example', phone: '(970) 555-0188', company: 'Mountain Village Music', event_name: 'Sunset Concert Series', event_date: daysAhead(35), quantity_estimate: 250, product_interest: ['tees', 'posters-prints'], description: 'Series tee and a limited 18x24 poster run.', artwork_files: [], status: 'quoted', internal_notes: 'Quoted $3,210 all-in.', created_at: daysAgo(9, 10), request_type: 'festival', source_page: '/quote' },
  { id: 'q-4', name: 'Ben Okafor', email: 'ben@example.com', phone: null, company: null, event_name: 'Family reunion', event_date: daysAhead(20), quantity_estimate: 40, product_interest: ['tees'], description: 'Reunion tees, 1-color front.', artwork_files: [], status: 'won', internal_notes: 'Approved by phone; converting to an order.', created_at: daysAgo(15, 14), request_type: 'custom', source_page: '/quote' },
  { id: 'q-5', name: 'Hollis Grant', email: 'hollis@example.com', phone: null, company: 'Grant Excavation', event_name: null, event_date: null, quantity_estimate: 12, product_interest: ['hats'], description: 'A dozen caps with our logo.', artwork_files: [], status: 'lost', internal_notes: 'Went with an online vendor.', created_at: daysAgo(40, 9), request_type: 'contact', source_page: '/contact' },
]

export const settings = {
  store: {
    name: 'Fishbone Graphics & Screen Printing',
    legal_name: 'Fishbone Graphics LLC',
    tagline: 'Hand-pulled in Ridgway since 1985',
    founded: 1985,
    phone: '(970) 626-4437',
    email: 'orders@fishbonegraphics.example',
    admin_email: 'fishbonegraphics@neonburro.com',
    address1: '123 N Lena St',
    address2: '',
    city: 'Ridgway',
    state: 'CO',
    zip: '81432',
    map_url: 'https://maps.example/fishbone',
    lat: 38.1525,
    lng: -107.7615,
    plus_code: '5624+XX Ridgway, Colorado',
    directions_note: 'Corner of Lena and Clinton, across from the town park. Park on Lena.',
    region: 'Uncompahgre Valley',
    elevation_ft: 6985,
    landmarks: [
      { name: 'Ridgway Town Park', distance: '1 block' },
      { name: 'True Grit Cafe', distance: '2 blocks' },
    ],
    hours: [
      { days: 'Mon–Fri', open: '9:00 AM', close: '5:00 PM' },
      { days: 'Sat', open: 'By appointment', close: '' },
    ],
    instagram: 'fishbonegraphics',
    facebook: '',
  },
  ordering: { turnaround_days: 10, rush_available: true, min_order_note: '12-piece minimum per design. Mixed sizes are fine.' },
  tax: { rate: 0.039, label: 'Sales tax', note: 'Tax-exempt organizations: send your certificate and we will remove tax from the invoice.' },
  shipping: { flat_rate: 18, enabled: true, note: 'Large festival runs ship freight; we confirm the rate before invoicing.' },
  payments: { provider: 'invoice', providers_available: ['invoice', 'stripe'], note: 'We review every order and send an invoice within one business day. Nothing is charged until you approve the proof.' },
  announcement: { enabled: true, text: 'Festival season: order by June 1 for on-time delivery.' },
}

export const admins = [
  { user_id: 'user-owner', email: 'tyler@neonburro.com', display_name: 'Tyler Reagan', role: 'owner' },
  { user_id: 'user-rae', email: 'rae@fishbonegraphics.example', display_name: 'Rae Fisher', role: 'admin' },
  { user_id: 'user-joel', email: 'joel@fishbonegraphics.example', display_name: 'Joel Fisher', role: 'staff' },
]

export const previewUser = {
  id: 'user-owner',
  email: 'tyler@neonburro.com',
  created_at: daysAgo(120),
  last_sign_in_at: daysAgo(0, 7),
  user_metadata: { display_name: 'Tyler Reagan', username: 'treagan' },
}

export const previewProfile = {
  user_id: 'user-owner',
  username: 'treagan',
  display_name: 'Tyler Reagan',
  email: 'tyler@neonburro.com',
  avatar_url: null,
  created_at: daysAgo(120),
  updated_at: daysAgo(3),
}

export const teamMembers = [
  { user_id: 'user-owner', email: 'tyler@neonburro.com', display_name: 'Tyler Reagan', role: 'owner', created_at: daysAgo(120), last_sign_in_at: daysAgo(0, 7), invited: false, profiles: { username: 'treagan', display_name: 'Tyler Reagan', avatar_url: null } },
  { user_id: 'user-rae', email: 'rae@fishbonegraphics.example', display_name: 'Rae Fisher', role: 'admin', created_at: daysAgo(90), last_sign_in_at: daysAgo(1, 9), invited: false, profiles: { username: 'rae', display_name: 'Rae Fisher', avatar_url: null } },
  { user_id: 'user-joel', email: 'joel@fishbonegraphics.example', display_name: 'Joel Fisher', role: 'staff', created_at: daysAgo(60), last_sign_in_at: daysAgo(4, 16), invited: false, profiles: { username: 'joel', display_name: 'Joel Fisher', avatar_url: null } },
  { user_id: 'user-sam', email: 'sam@fishbonegraphics.example', display_name: 'Sam Ortega', role: 'staff', created_at: daysAgo(2), last_sign_in_at: null, invited: true, profiles: { username: null, display_name: 'Sam Ortega', avatar_url: null } },
]

export const accountRequests = [
  { id: 'req-1', name: 'Mia Calloway', email: 'mia@example.com', requested_username: 'mia.c', message: 'I run the front counter Tue–Sat and need to look up orders for pickups.', status: 'new', created_at: daysAgo(1, 12) },
  { id: 'req-2', name: 'Devon Pratt', email: 'devon@example.com', requested_username: 'devon', message: 'Summer press help. Joel said to request access.', status: 'new', created_at: daysAgo(3, 15) },
]

export const showcase = [
  { id: 'sc-1', placement: 'home', title: 'Bluegrass 2025 tour tee', subtitle: null, client_name: 'Telluride Bluegrass Festival', year: 2025, image_path: 'home/a1.jpg', image_url: swatchImage('#2BB3A3', 'TBF 25'), alt: 'Seafoam tee with 3-color festival print', link_url: null, tags: ['festival', 'screen print'], accent_hex: '#2BB3A3', width: 1600, height: 1200, sort_order: 0, is_active: true, created_at: daysAgo(30) },
  { id: 'sc-2', placement: 'home', title: 'Ice Park crew caps', subtitle: null, client_name: 'Ouray Ice Park', year: 2026, image_path: 'home/a2.jpg', image_url: swatchImage('#4F5A3C', 'OIP'), alt: 'Loden trucker caps with embroidered mark', link_url: null, tags: ['embroidery', 'hats'], accent_hex: '#C6F135', width: 1200, height: 1600, sort_order: 1, is_active: true, created_at: daysAgo(20) },
  { id: 'sc-3', placement: 'home', title: 'RiverFest volunteer tees', subtitle: null, client_name: 'Ridgway RiverFest', year: 2025, image_path: 'home/a3.jpg', image_url: swatchImage('#FF6A13', 'RVR'), alt: 'Hi-vis orange volunteer tees stacked on the press', link_url: null, tags: ['festival'], accent_hex: '#FF6A13', width: 1600, height: 1067, sort_order: 2, is_active: true, created_at: daysAgo(18) },
  { id: 'sc-4', placement: 'home', title: 'Sunset Series poster', subtitle: null, client_name: 'Mountain Village Music', year: 2025, image_path: 'home/a4.jpg', image_url: swatchImage('#8B1E2D', 'MVM'), alt: 'Hand-pulled 18x24 gig poster in crimson', link_url: null, tags: ['poster'], accent_hex: '#8B1E2D', width: 1200, height: 1800, sort_order: 3, is_active: false, created_at: daysAgo(15) },
  { id: 'sc-5', placement: 'work', title: 'Demons volleyball', subtitle: null, client_name: 'Ridgway Secondary School', year: 2026, image_path: 'work/b1.jpg', image_url: swatchImage('#0B0B0C', 'RSS'), alt: 'Black tees with names and numbers', link_url: null, tags: ['school'], accent_hex: '#F2EDE4', width: 1600, height: 1200, sort_order: 0, is_active: true, created_at: daysAgo(12) },
  { id: 'sc-6', placement: 'hero', title: 'The press room', subtitle: 'Hand-pulled since 1985', client_name: null, year: null, image_path: 'hero/c1.jpg', image_url: swatchImage('#141416', 'HERO'), alt: 'Six-color manual press under shop lights', link_url: '/about', tags: [], accent_hex: '#FF6A13', width: 2400, height: 1350, sort_order: 0, is_active: true, created_at: daysAgo(40) },
]

export const posts = [
  { id: 'post-1', slug: 'festival-season-2026-deadlines', title: 'Festival season 2026: order deadlines', kicker: 'Plan ahead', excerpt: 'Bluegrass, RiverFest and the Sunset Series all land within six weeks. Here is when art needs to be in.', body: '## The short version\n\nGet art to us **four weeks** before your event.\n\n- Telluride Bluegrass: art by May 20\n- Ridgway RiverFest: art by June 1\n- Sunset Series: rolling, two weeks per run\n\nWe print in the order deposits land.', cover_image_path: 'covers/p1.jpg', cover_image_url: swatchImage('#FF6A13', 'DEADLINES'), cover_alt: 'Calendar taped to the press', tags: ['festival', 'deadlines'], author_id: 'user-rae', author_name: 'Rae Fisher', is_published: true, published_at: daysAgo(6), is_pinned: true, created_at: daysAgo(7), updated_at: daysAgo(6) },
  { id: 'post-2', slug: 'why-we-print-water-based', title: 'Why we print water-based on festival tees', kicker: 'Shop notes', excerpt: 'Softer hand, better breathability at altitude, and it ages like a tour shirt should.', body: 'Water-based ink soaks into the fibers instead of sitting on top...', cover_image_path: null, cover_image_url: null, cover_alt: null, tags: ['process'], author_id: 'user-rae', author_name: 'Rae Fisher', is_published: true, published_at: daysAgo(25), is_pinned: false, created_at: daysAgo(26), updated_at: daysAgo(25) },
  { id: 'post-3', slug: 'new-press-arrives', title: 'The new six-color press is here', kicker: 'Shop news', excerpt: 'Draft. Photos to come once it is bolted down.', body: 'More colors, tighter registration, same hands.', cover_image_path: null, cover_image_url: null, cover_alt: null, tags: ['shop'], author_id: 'user-owner', author_name: 'Tyler Reagan', is_published: false, published_at: null, is_pinned: false, created_at: daysAgo(2), updated_at: daysAgo(1) },
]

export const activity = [
  { id: 'act-1', user_id: 'admin-1', user_email: 'rae@fishbonegraphics.example', user_name: 'Rae Fisher', action: 'status_changed', entity_type: 'order', entity_id: 'ord-2', entity_name: 'FB-26-01006', details: {}, created_at: daysAgo(1, 17) },
  { id: 'act-2', user_id: 'admin-2', user_email: 'joel@fishbonegraphics.example', user_name: 'Joel Fisher', action: 'status_changed', entity_type: 'order', entity_id: 'ord-3', entity_name: 'FB-26-01005', details: {}, created_at: daysAgo(1, 8) },
  { id: 'act-3', user_id: 'admin-1', user_email: 'rae@fishbonegraphics.example', user_name: 'Rae Fisher', action: 'updated', entity_type: 'product', entity_id: 'prod-1', entity_name: 'Comfort Colors 1717 Heavyweight Tee', details: {}, created_at: daysAgo(2, 11) },
  { id: 'act-4', user_id: 'admin-1', user_email: 'rae@fishbonegraphics.example', user_name: 'Rae Fisher', action: 'updated', entity_type: 'settings', entity_id: 'announcement', entity_name: 'Settings · announcement', details: {}, created_at: daysAgo(2, 9) },
  { id: 'act-5', user_id: 'admin-2', user_email: 'joel@fishbonegraphics.example', user_name: 'Joel Fisher', action: 'created', entity_type: 'category', entity_id: 'cat-posters', entity_name: 'Posters & Prints', details: {}, created_at: daysAgo(4, 15) },
  { id: 'act-6', user_id: 'admin-1', user_email: 'rae@fishbonegraphics.example', user_name: 'Rae Fisher', action: 'reordered', entity_type: 'category', entity_id: null, entity_name: 'Categories', details: {}, created_at: daysAgo(4, 15) },
]
