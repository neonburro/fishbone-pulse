// netlify/functions/send-quote.js
//
// Emails the customer their quote with a link to accept it, and a copy to
// the shop. Pulse calls issue_quote first (that mints the token and logs
// it), then posts the order summary and the token here. With reminder:
// true it is the same email with reminder wording. This function only
// sends mail, it holds no database key.
//
// The sheet is lib/mail.js, shared with the storefront. Env is documented
// in docs/mail-and-dns.md. No oxford commas, no em dashes.

import { sheet, panel, send, esc, isEmail, money, label, BONE, MUTE, DIM, LINE, FONT, MONO, PHONE } from './lib/mail.js'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM = process.env.NOTIFY_FROM || 'Fishbone Graphics <hello@fishbone.neonburro.com>'
const REPLY_TO = process.env.REPLY_TO || 'sales@fishbonegraphics.com'
const SITE = process.env.SITE_URL || 'https://fishbonegraphics.netlify.app'
const ADMIN_TO = (process.env.ADMIN_TO || 'fishbonegraphics@neonburro.com').split(',').map((s) => s.trim()).filter(Boolean)

const line = (k, v, bold = false) => `<tr><td style="padding:9px 0;border-top:1px solid ${LINE};font-family:${FONT};font-size:14px;color:${bold ? BONE : MUTE};font-weight:${bold ? 700 : 400}">${k}</td><td align="right" style="padding:9px 0;border-top:1px solid ${LINE};font-family:${MONO};font-size:${bold ? 16 : 13}px;color:${BONE};font-weight:${bold ? 700 : 400}">${v}</td></tr>`

function quoteHtml(q, link) {
  const first = String(q.contact?.name || '').trim().split(/\s+/)[0] || 'there'
  const items = (q.items || []).map((it) => {
    const sizes = it.size_breakdown && typeof it.size_breakdown === 'object' ? Object.entries(it.size_breakdown).filter(([, n]) => Number(n) > 0).map(([s, n]) => `${s} ${n}`).join(', ') : ''
    const where = Array.isArray(it.print_locations) && it.print_locations.length ? it.print_locations.join(', ').replace(/_/g, ' ') : ''
    return `<tr><td style="padding:10px 0;vertical-align:top"><div style="font-family:${FONT};font-size:14px;font-weight:500;color:${BONE}">${esc(it.product_name)}${it.variant_label ? `, ${esc(it.variant_label)}` : ''}</div><div style="font-family:${MONO};font-size:11px;color:${MUTE};margin-top:3px">${esc([it.quantity ? `${it.quantity} pcs` : null, where, sizes].filter(Boolean).join(', '))}</div>${it.notes ? `<div style="font-family:${FONT};font-size:13px;color:${MUTE};margin-top:4px">${esc(it.notes)}</div>` : ''}</td><td align="right" style="padding:10px 0;vertical-align:top;font-family:${MONO};font-size:13px;color:${BONE};white-space:nowrap">${money(it.line_total)}</td></tr>`
  }).join('')
  const totals = `${line('Garments and print', money(q.subtotal))}${Number(q.setup_fees) > 0 ? line('Screens and setup', money(q.setup_fees)) : ''}${Number(q.discount) > 0 ? line('Discount', '-' + money(q.discount)) : ''}${Number(q.shipping) > 0 ? line('Shipping', money(q.shipping)) : ''}${Number(q.tax) > 0 ? line('Tax', money(q.tax)) : ''}${line('Total', money(q.total), true)}`
  return sheet({
    site: SITE,
    tag: q.reminder ? 'Reminder' : 'Quote',
    heading: q.reminder ? `Still here for you, ${first}` : `Here is your quote, ${first}`,
    lede: esc(q.reminder ? 'Your quote is still open and the press schedule is filling up. Open the proof and accept it when you are ready.' : 'A printer looked at the job. Here is the number. Open the proof, check it over and accept it, and we will put you on the press schedule.'),
    body: `${q.quote_note ? panel({ title: 'From the shop', html: `<div style="font-family:${FONT};font-size:14px;line-height:1.6;color:${BONE};white-space:pre-wrap">${esc(q.quote_note)}</div>` }) : ''}
      ${panel({ title: `Job ticket ${esc(q.order_number)}`, html: `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">${items}${totals}</table>` })}
      <div style="margin:0 0 20px">${label(`Good for 30 days${q.needed_by ? `, needed by ${esc(q.needed_by)}` : ''}. Questions, reply to this email or call ${PHONE}`, DIM)}</div>`,
    cta: { href: link, label: 'See the proof and accept' },
    note: 'One tap on the proof page and you are on the board',
  })
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method not allowed' }
  let q
  try { q = JSON.parse(event.body || '{}') } catch { return { statusCode: 400, body: 'Bad JSON' } }
  const to = String(q.contact?.email || '').trim().toLowerCase()
  if (!q.token || !q.order_number || !isEmail(to)) return { statusCode: 400, body: JSON.stringify({ ok: false, reason: 'token, order number and a customer email' }) }
  const link = `${SITE}/proof/${q.token}/`
  if (!RESEND_API_KEY) return { statusCode: 200, body: JSON.stringify({ ok: false, reason: 'no key', link }) }
  const ok = await send(RESEND_API_KEY, {
    from: FROM, to: [to], bcc: ADMIN_TO, reply_to: REPLY_TO,
    subject: q.reminder ? `A reminder about your quote, ${q.order_number}` : `Your quote from Fishbone Graphics, ${q.order_number}`,
    html: quoteHtml(q, link),
  }, 'quote')
  return { statusCode: 200, body: JSON.stringify({ ok, link }) }
}
