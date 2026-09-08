// netlify/functions/send-quote.js
//
// Emails the customer their quote with a link to accept it. Pulse calls
// issue_quote first (that mints the token and logs it), then posts the
// order summary and the token here. This function only sends mail, it
// holds no database key. Same sheet as notify-admin: ink at the top, paper
// below, type only.
//
// Env: RESEND_API_KEY, NOTIFY_FROM, REPLY_TO, SITE_URL, ADMIN_TO.
// No oxford commas, no em dashes.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.NOTIFY_FROM || 'Fishbone Graphics <fishbone@neonburro.com>'
const REPLY_TO = process.env.REPLY_TO || 'sales@fishbonegraphics.com'
const SITE = process.env.SITE_URL || 'https://fishbonegraphics.com'
const ADMIN_TO = (process.env.ADMIN_TO || 'fishbonegraphics@neonburro.com').split(',').map((s) => s.trim()).filter(Boolean)
const PHONE = '(970) 626-4350'

const INK = '#161618', PAPER = '#F6F2EA', PAPER2 = '#ECE6DA', TYPE = '#1B1B1E', MUTE = '#6B6760', SLATE = '#9AA1AA', RED = '#EC1D3B'
const FONT = "'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const MONO = "'JetBrains Mono', Menlo, Consolas, monospace"
const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim())
const kicker = (text, color = SLATE) => `<div style="font-family:${MONO};font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:${color}">${text}</div>`
const wordmark = `<table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="padding-right:10px;vertical-align:middle"><span style="display:inline-block;width:9px;height:9px;border-radius:9px;background:${RED}"></span></td><td style="vertical-align:middle;font-family:${FONT};font-weight:700;font-size:22px;letter-spacing:.02em;text-transform:uppercase;color:#EFEAE0;line-height:1">Fishbone<div style="font-family:${MONO};font-size:9px;letter-spacing:.34em;text-transform:uppercase;color:${SLATE};margin-top:3px">Graphics</div></td></tr></table>`

function sheet({ eyebrow, heading, sub, body, cta }) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:${INK}"><table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${INK}"><tr><td align="center" style="padding:32px 16px">
<table width="600" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%">
  <tr><td style="padding:4px 6px 22px">${wordmark}<div style="margin-top:22px">${kicker(esc(eyebrow), RED)}</div><div style="margin-top:8px;font-family:${FONT};font-weight:700;font-size:28px;line-height:1.05;color:#EFEAE0">${esc(heading)}</div>${sub ? `<div style="margin-top:8px;font-family:${FONT};font-size:14px;color:${SLATE}">${esc(sub)}</div>` : ''}</td></tr>
  <tr><td style="background:${PAPER};border-radius:18px;padding:24px 26px 26px;font-family:${FONT};color:${TYPE}">${body}${cta ? `<div style="margin-top:24px"><a href="${cta.href}" style="display:inline-block;background:${RED};color:#FBF8F2;text-decoration:none;padding:13px 24px;border-radius:10px;font-family:${FONT};font-weight:700;font-size:14px;letter-spacing:.06em;text-transform:uppercase">${esc(cta.label)}</a></div>` : ''}</td></tr>
  <tr><td style="padding:20px 6px 0">${kicker('Est 1985 · 250 S Lena St · Ridgway, CO · ' + PHONE, '#6B727C')}</td></tr>
</table></td></tr></table></body></html>`
}

const row = (k, v, bold = false) => `<tr><td style="padding:9px 0;border-bottom:1px solid ${PAPER2};font-family:${FONT};font-size:14px;color:${bold ? TYPE : MUTE}">${k}</td><td align="right" style="padding:9px 0;border-bottom:1px solid ${PAPER2};font-family:${MONO};font-size:13px;color:${TYPE};font-weight:${bold ? 700 : 400}">${v}</td></tr>`

function quoteHtml(q, link) {
  const first = String(q.contact?.name || '').trim().split(/\s+/)[0] || 'there'
  const items = (q.items || []).map((it) => {
    const sizes = it.size_breakdown && typeof it.size_breakdown === 'object' ? Object.entries(it.size_breakdown).filter(([, n]) => Number(n) > 0).map(([s, n]) => `${s} ${n}`).join(' · ') : ''
    const where = Array.isArray(it.print_locations) && it.print_locations.length ? it.print_locations.join(', ').replace(/_/g, ' ') : ''
    return `<tr><td style="padding:10px 0;border-bottom:1px solid ${PAPER2};font-family:${FONT};font-size:14px;color:${TYPE}"><div style="font-weight:600">${esc(it.product_name)}${it.variant_label ? ` · ${esc(it.variant_label)}` : ''}</div><div style="font-family:${MONO};font-size:11px;color:${MUTE};margin-top:3px">${esc([it.quantity ? `${it.quantity} pcs` : null, where, sizes].filter(Boolean).join(' · '))}</div>${it.notes ? `<div style="font-size:13px;color:${MUTE};margin-top:4px">${esc(it.notes)}</div>` : ''}</td><td align="right" valign="top" style="padding:10px 0;border-bottom:1px solid ${PAPER2};font-family:${MONO};font-size:13px;color:${TYPE};white-space:nowrap">${money(it.line_total)}</td></tr>`
  }).join('')
  return sheet({
    eyebrow: `${q.reminder ? 'A reminder · ' : 'Quote · '}${q.order_number}`,
    heading: q.reminder ? `Still here for you, ${first}.` : `Here is your quote, ${first}.`,
    sub: q.needed_by ? `Needed by ${q.needed_by}` : null,
    body: `<p style="margin:0 0 16px;font-size:15px;line-height:1.6">${q.reminder ? 'Your quote is still open and the press schedule is filling up. Open the link to see the proof and accept it when you are ready.' : 'A printer looked at the job. Here is the number. Open the link to see the full proof and accept it, and we will put you on the press schedule.'}</p>
      ${q.quote_note ? `<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${MUTE};white-space:pre-wrap">${esc(q.quote_note)}</p>` : ''}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}
      ${row('Garments and print', money(q.subtotal))}${Number(q.setup_fees) > 0 ? row('Screens and setup', money(q.setup_fees)) : ''}${Number(q.discount) > 0 ? row('Discount', '-' + money(q.discount)) : ''}${Number(q.shipping) > 0 ? row('Shipping', money(q.shipping)) : ''}${Number(q.tax) > 0 ? row('Tax', money(q.tax)) : ''}${row('Total', money(q.total), true)}</table>
      <p style="margin:16px 0 0;font-size:12px;color:${MUTE}">Good for 30 days. Questions, reply to this email or call ${PHONE}.</p>`,
    cta: { href: link, label: 'See the proof and accept' },
  })
}

async function send(payload, label) {
  try {
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) console.error(`[send-quote:${label}]`, res.status, await res.text())
    return res.ok
  } catch (err) { console.error(`[send-quote:${label}]`, err.message); return false }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  if (!RESEND_API_KEY) return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'no key' }) }
  let q
  try { q = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, body: 'Bad JSON' } }
  const to = String(q.contact?.email || '').trim().toLowerCase()
  if (!q.token || !q.order_number || !isEmail(to)) return { statusCode: 400, body: JSON.stringify({ ok: false, reason: 'token, order number and email' }) }
  const link = `${SITE}/proof/${q.token}/`
  const ok = await send({ from: FROM, to: [to], bcc: ADMIN_TO, reply_to: REPLY_TO, subject: q.reminder ? `A reminder about your quote · ${q.order_number}` : `Your quote from Fishbone Graphics · ${q.order_number}`, html: quoteHtml(q, link) }, 'customer')
  return { statusCode: 200, body: JSON.stringify({ ok, link }) }
}
