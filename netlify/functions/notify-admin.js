// netlify/functions/notify-admin.js
//
// Two emails for every form on the site. One to the shop, one back to the
// person who wrote in. Contact, run request, Pulse access request and
// quote accepted all come through here, the kind picks the words. The
// record itself is already in Supabase, these are the notice and the
// receipt, so a failure here never fails the form.
//
// The sheet is lib/mail.js, shared with Pulse. Env is documented in
// docs/mail-and-dns.md. No oxford commas, no em dashes.

import { sheet, panel, send, esc, isEmail, stamp, label, BONE, MUTE, DIM, PHONE } from './lib/mail.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.NOTIFY_FROM || 'Fishbone Graphics <hello@fishbone.neonburro.com>'
const ADMIN_TO = (process.env.ADMIN_TO || 'fishbonegraphics@neonburro.com').split(',').map((s) => s.trim()).filter(Boolean)
const REPLY_TO = process.env.REPLY_TO || 'sales@fishbonegraphics.com'
const PULSE = process.env.PULSE_URL || 'https://fishbonepulse.netlify.app'
const SITE = process.env.SITE_URL || 'https://fishbonegraphics.netlify.app'

const KINDS = {
  contact: {
    tag: 'Message', shopHeading: (d) => `${d.name} wrote in`, shopLede: 'A note through the site. Reply to this email and it goes straight to them.', path: '/quotes/', button: 'Open in Backstage',
    subject: 'Got it, Fishbone Graphics', customerTag: 'Received', customerHeading: (first) => `Got it, ${first}`,
    customerLede: 'A person reads everything that comes in here, usually the same day. If it is a job, expect a proof or a straight answer back.',
  },
  quote: {
    tag: 'Run request', shopHeading: (d) => `${d.name} wants a run`, shopLede: 'A run request through the site. Start a run from it in Backstage, or reply to this email and it goes straight to them.', path: '/quotes/', button: 'Open in Backstage',
    subject: 'Your run request is in, Fishbone Graphics', customerTag: 'Received', customerHeading: (first) => `Got it, ${first}`,
    customerLede: 'A printer will look at the job and come back with a proof and a number, usually within a business day.',
  },
  design: {
    tag: 'Design request', shopHeading: (d) => `${d.name} has an idea`, shopLede: 'No art yet, they want the shop to draw it. A pencil before a squeegee.', path: '/quotes/', button: 'Open in Backstage',
    subject: 'Your idea is in, Fishbone Graphics', customerTag: 'Received', customerHeading: (first) => `Got it, ${first}`,
    customerLede: 'Someone who draws will read it and come back with questions or a first sketch, usually within a couple of days.',
  },
  quote_accepted: {
    tag: 'Accepted', shopHeading: (d) => `${d.name} accepted the quote`, shopLede: 'The customer said yes. The run is waiting on payment.', path: '/orders/', button: 'Open the run',
    subject: 'You accepted the quote, Fishbone Graphics', customerTag: 'Accepted', customerHeading: (first) => `Thanks, ${first}`,
    customerLede: 'Your run is on the board. The invoice comes next, and the shop will call if anything about the job needs a decision.',
  },
  account_request: {
    tag: 'Access request', shopHeading: (d) => `${d.name} asked for a login`, shopLede: 'Someone asked for Backstage access. Nothing is created until you approve it in Settings, Team.', path: '/settings/?tab=team', button: 'Review in Backstage',
    subject: 'Access request received, Fishbone Backstage', customerTag: 'Received', customerHeading: (first) => `Got it, ${first}`,
    customerLede: 'Your request for a Backstage login is in. A shop admin reviews every request. Once it is approved you will get an invite link to set your password.',
  },
}

function details(d, { withPage = true } = {}) {
  const extras = d.extra ? Object.entries(d.extra).filter(([, v]) => v).map(([k, v]) => [k, esc(v)]) : []
  return panel({
    title: 'What they sent',
    rows: [
      ['Name', esc(d.name)],
      ['Email', `<a href="mailto:${esc(d.email)}" style="color:${BONE}">${esc(d.email)}</a>`],
      ['Phone', esc(d.phone)],
      ...extras,
      ['Note', esc(d.description).replace(/\n/g, '<br>')],
      ['Files', d.files.length ? d.files.map(esc).join('<br>') : ''],
      ['From', withPage && d.page ? esc(d.page) : ''],
    ],
  })
}

function shopHtml(kind, d) {
  const k = KINDS[kind]
  // A request id opens that exact request in Backstage, files and all.
  const href = d.requestId && k.path === '/quotes/' ? `${PULSE}/quotes/?open=${d.requestId}` : PULSE + k.path
  const filesNote = d.files.length ? `<div style="margin:-6px 0 16px">${label('The files are on the request in Backstage, tap the button', DIM)}</div>` : ''
  return sheet({ site: SITE, tag: k.tag, heading: k.shopHeading(d), lede: `${esc(k.shopLede)}<br><span style="color:${MUTE}">${stamp()}</span>`, body: details(d) + filesNote, cta: { href, label: d.requestId ? 'Open this request' : k.button } })
}

function customerHtml(kind, d) {
  const k = KINDS[kind]
  const first = String(d.name || '').trim().split(/\s+/)[0] || 'there'
  return sheet({
    site: SITE, tag: k.customerTag, heading: k.customerHeading(first),
    lede: esc(k.customerLede),
    body: `${details({ ...d, page: null }, { withPage: false }).replace('What they sent', 'What you sent')}<div style="margin:0 0 20px">${label(`If it is urgent, call ${PHONE}`, MUTE)}</div>`,
    cta: kind === 'account_request' ? null : { href: SITE + '/work/', label: 'See the work' },
  })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  if (!RESEND_API_KEY) return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'no key' }) }
  let body
  try { body = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, body: 'Bad JSON' } }
  const kind = KINDS[body.kind] ? body.kind : 'contact'
  const d = {
    name: String(body.name || '').trim().slice(0, 120),
    email: String(body.email || '').trim().toLowerCase(),
    phone: String(body.phone || '').trim().slice(0, 40),
    description: String(body.description || '').trim().slice(0, 4000),
    files: Array.isArray(body.files) ? body.files.slice(0, 20).map((f) => String(f).slice(0, 160)) : [],
    page: body.page ? String(body.page).slice(0, 200) : null,
    extra: body.extra && typeof body.extra === 'object' ? body.extra : null,
    requestId: /^[0-9a-f-]{36}$/i.test(String(body.request_id || '')) ? String(body.request_id) : null,
  }
  if (!d.name || !isEmail(d.email)) return { statusCode: 400, body: JSON.stringify({ ok: false, reason: 'name and email' }) }

  const admin = await send(RESEND_API_KEY, { from: FROM, to: ADMIN_TO, reply_to: d.email, subject: `${KINDS[kind].tag} from ${d.name}`, html: shopHtml(kind, d) }, 'shop')
  const customer = await send(RESEND_API_KEY, { from: FROM, to: [d.email], reply_to: REPLY_TO, subject: KINDS[kind].subject, html: customerHtml(kind, d) }, 'customer')
  return { statusCode: 200, body: JSON.stringify({ ok: admin && customer, admin, customer }) }
}
