// netlify/functions/notify-admin.js (fishbone-pulse copy, keep in step with the storefront)
//
// Two emails for every form on the site. One to the shop, one back to the
// person who wrote in. Contact, run request and Pulse access request all
// come through here, the kind picks the words. Sends through Resend. The
// record itself is already in Supabase, these are the notice and the
// receipt, so a failure here never fails the form.
//
// No images. The wordmark is type. The email is ink at the top and paper
// below, like the site, and it reads the same in every mail client because
// it is tables and inline styles.
//
// Env on the Netlify site, never in git:
//   RESEND_API_KEY   send only key from the Resend account that has the
//                    sending domain verified
//   NOTIFY_FROM      'Fishbone Graphics <hello@yourverifieddomain>'
//   ADMIN_TO         where the shop copy goes, comma separated for more
//   REPLY_TO         the address a customer's reply should land on
//   PULSE_URL        link in the shop copy
//   SITE_URL         link in the customer copy
//
// No oxford commas, no em dashes.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.NOTIFY_FROM || 'Fishbone Graphics <fishbone@neonburro.com>'
const ADMIN_TO = (process.env.ADMIN_TO || 'fishbonegraphics@neonburro.com').split(',').map((s) => s.trim()).filter(Boolean)
const REPLY_TO = process.env.REPLY_TO || 'sales@fishbonegraphics.com'
const PULSE = process.env.PULSE_URL || 'https://fishbonepulse.netlify.app'
const SITE = process.env.SITE_URL || 'https://fishbonegraphics.com'
const PHONE = '(970) 626-4350'

const KINDS = {
  contact: {
    admin: 'Message from the site',
    path: '/quotes/',
    blurb: 'Someone sent a note through the site.',
    subject: 'Got it. Fishbone Graphics',
    customer: 'Thanks for writing. A person reads everything that comes in here, usually the same day. If it is a job, expect a proof or a straight answer back.',
  },
  quote: {
    admin: 'Run request',
    path: '/quotes/',
    blurb: 'Someone wants a run priced.',
    subject: 'Your run request is in. Fishbone Graphics',
    customer: 'Thanks for sending it. A printer will look at the job and come back with a proof and a number, usually within a business day.',
  },
  quote_accepted: {
    admin: 'Quote accepted',
    path: '/orders/',
    blurb: 'The customer accepted the quote. The run is waiting on payment.',
    subject: 'You accepted the quote. Fishbone Graphics',
    customer: 'Thanks. Your run is on the board. We will send the invoice next, and the shop will call if anything about the job needs a decision.',
  },
  account_request: {
    admin: 'Pulse access request',
    path: '/settings/',
    blurb: 'Someone asked for a Pulse login. Nothing is created until you approve it inside Pulse.',
    subject: 'Access request received. Fishbone Pulse',
    customer: 'Your request for a Pulse login is in. A shop admin reviews every request. Once it is approved you will get an invite link to set your password.',
  },
}

const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim())
const stamp = () => `${new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Denver' })} MT`

// ── the sheet ───────────────────────────────────────────────────────────────
const INK = '#161618', PAPER = '#F6F2EA', PAPER2 = '#ECE6DA', TYPE = '#1B1B1E', MUTE = '#6B6760', SLATE = '#9AA1AA', RED = '#EC1D3B'
const FONT = "'Barlow', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const MONO = "'JetBrains Mono', Menlo, Consolas, monospace"

const kicker = (text, color = SLATE) => `<div style="font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${color}">${text}</div>`

const wordmark = `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
  <td style="padding-right:10px;vertical-align:middle"><span style="display:inline-block;width:9px;height:9px;border-radius:9px;background:${RED}"></span></td>
  <td style="vertical-align:middle;font-family:${FONT};font-weight:700;font-size:22px;letter-spacing:.02em;text-transform:uppercase;color:#EFEAE0;line-height:1">Fishbone<div style="font-family:${MONO};font-size:9px;letter-spacing:.34em;text-transform:uppercase;color:${SLATE};margin-top:3px">Graphics</div></td>
</tr></table>`

function sheet({ eyebrow, heading, sub, body, cta, foot }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${INK}">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${INK}"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%">
  <tr><td style="padding:4px 6px 22px">${wordmark}
    <div style="margin-top:22px">${kicker(esc(eyebrow), RED)}</div>
    <div style="margin-top:8px;font-family:${FONT};font-weight:700;font-size:28px;line-height:1.05;color:#EFEAE0">${esc(heading)}</div>
    ${sub ? `<div style="margin-top:8px;font-family:${FONT};font-size:14px;color:${SLATE}">${esc(sub)}</div>` : ''}
  </td></tr>
  <tr><td style="background:${PAPER};border-radius:18px;padding:24px 26px 26px;font-family:${FONT};color:${TYPE}">
    ${body}
    ${cta ? `<div style="margin-top:24px"><a href="${cta.href}" style="display:inline-block;background:${RED};color:#FBF8F2;text-decoration:none;padding:12px 22px;border-radius:10px;font-family:${FONT};font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase">${esc(cta.label)}</a></div>` : ''}
  </td></tr>
  <tr><td style="padding:20px 6px 0">${kicker(foot || 'Est 1985 · 250 S Lena St · Ridgway, CO · ' + PHONE, '#6B727C')}</td></tr>
</table></td></tr></table></body></html>`
}

const row = (k, v) => v ? `<tr><td style="padding:10px 0;border-bottom:1px solid ${PAPER2};font-family:${MONO};font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:${MUTE};width:34%;vertical-align:top">${esc(k)}</td><td style="padding:10px 0;border-bottom:1px solid ${PAPER2};font-family:${FONT};font-size:15px;color:${TYPE};vertical-align:top;line-height:1.5">${v}</td></tr>` : ''

function details(d) {
  const extras = d.extra ? Object.entries(d.extra).filter(([, v]) => v).map(([k, v]) => row(k, esc(v))).join('') : ''
  const files = d.files.length ? d.files.map(esc).join('<br>') : ''
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">
    ${row('Name', esc(d.name))}
    ${row('Email', `<a href="mailto:${esc(d.email)}" style="color:${TYPE}">${esc(d.email)}</a>`)}
    ${row('Phone', esc(d.phone))}
    ${extras}
    ${row('Note', esc(d.description).replace(/\n/g, '<br>'))}
    ${row('Files', files)}
    ${row('From page', esc(d.page))}
  </table>`
}

function adminHtml(kind, d) {
  const k = KINDS[kind]
  return sheet({
    eyebrow: k.admin,
    heading: d.name,
    sub: stamp(),
    body: `<p style="margin:0 0 14px;font-size:14px;line-height:1.6;color:${MUTE}">${esc(k.blurb)} Reply to this email and it goes straight to them.</p>${details(d)}`,
    cta: { href: PULSE + k.path, label: 'Open in Pulse' },
  })
}

function customerHtml(kind, d) {
  const k = KINDS[kind]
  const first = String(d.name || '').trim().split(/\s+/)[0] || 'there'
  return sheet({
    eyebrow: 'Received',
    heading: `Got it, ${first}.`,
    sub: stamp(),
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${esc(k.customer)}</p>
      <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:${MUTE}">Here is what you sent, for your records. If it is urgent, call ${PHONE}.</p>
      ${details({ ...d, page: null })}`,
    cta: kind === 'account_request' ? null : { href: SITE + '/work/', label: 'See the work' },
  })
}

async function send(payload, label) {
  try {
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) console.error(`[notify-admin:${label}]`, res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error(`[notify-admin:${label}]`, err.message)
    return false
  }
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
  }
  if (!d.name || !isEmail(d.email)) return { statusCode: 400, body: JSON.stringify({ ok: false, reason: 'name and email' }) }

  const admin = await send({ from: FROM, to: ADMIN_TO, reply_to: d.email, subject: `${KINDS[kind].admin} · ${d.name}`, html: adminHtml(kind, d) }, 'admin')
  const customer = await send({ from: FROM, to: [d.email], reply_to: REPLY_TO, subject: KINDS[kind].subject, html: customerHtml(kind, d) }, 'customer')
  return { statusCode: 200, body: JSON.stringify({ ok: admin && customer, admin, customer }) }
}
