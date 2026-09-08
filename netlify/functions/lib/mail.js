// netlify/functions/lib/mail.js
//
// The one email sheet every Fishbone mail is printed on. Built like
// Backstage: an ink frame across the top with the fish mark and FISHBONE
// in bone and a small orange label, then the paper room with a condensed
// heading, a muted line, white cards for the details and an orange pill.
// No dots between things, commas and line breaks instead. Tables and
// inline styles only, so it reads the same in every mail client.
//
// The fish mark is a PNG the storefront serves at /email/mark-paper.png,
// rendered from the nav SVG because mail clients strip SVG. FISHBONE next
// to it is type, so it reads even with images off. Weights stay light,
// the way Backstage lands: a small orange kicker, a condensed title, a
// muted line under it.
//
// Shared between the storefront and Pulse. Change both copies.
// No oxford commas, no em dashes.

// Names kept from the first draft so the callers did not change: BONE is
// the type color on paper, INK is the outer ground, CARD is a white card,
// PANEL is the paper room. FRAME is the ink band at the top.
export const INK = '#ECE6DA', CARD = '#FFFFFF', PANEL = '#F6F2EA', LINE = '#E2DCD0', FRAME = '#161618', FRAME_LINE = '#2C2F35'
export const BONE = '#1B1B1E', MUTE = '#6B6760', DIM = '#8E8A82', EMBER = '#FF6A13', ON_EMBER = '#161618', ON_FRAME = '#EFEAE0'
export const FONT = "'Karla', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
export const HEAD = "'Barlow Condensed', 'Arial Narrow', 'Helvetica Neue', Arial, sans-serif"
export const MONO = "'JetBrains Mono', Menlo, Consolas, monospace"
export const PHONE = '(970) 626-4350'

export const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim())
export const money = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
export const stamp = () => `${new Date().toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Denver' })} MT`

export const label = (text, color = MUTE) => `<div style="font-family:${MONO};font-size:10px;font-weight:500;letter-spacing:.16em;text-transform:uppercase;color:${color}">${text}</div>`

/** A panel inside the card. `title` is a small label, `rows` is [[k, v], ...] or raw html. */
export function panel({ title, rows, html, tone = 'panel' }) {
  const bg = tone === 'ink' ? FRAME : CARD
  const body = html || `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-collapse:collapse">${(rows || []).filter(([, v]) => v != null && v !== '').map(([k, v], i, arr) => `<tr><td style="padding:9px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${LINE};` : ''}vertical-align:top;width:34%">${label(esc(k), DIM)}</td><td style="padding:9px 0;${i < arr.length - 1 ? `border-bottom:1px solid ${LINE};` : ''}vertical-align:top;font-family:${FONT};font-size:14px;line-height:1.55;color:${BONE}">${v}</td></tr>`).join('')}</table>`
  return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${bg};border:1px solid ${LINE};border-radius:12px;margin:0 0 16px"><tr><td style="padding:18px 20px">${title ? `<div style="margin-bottom:10px">${label(esc(title), EMBER)}</div>` : ''}${body}</td></tr></table>`
}

/**
 * The sheet.
 *   site     the storefront origin, for the lockup image and links
 *   tag      small orange label top right, like Portal Access
 *   heading  big line, Barlow Condensed
 *   lede     one muted paragraph
 *   body     html, usually a few panel() calls
 *   cta      { href, label } for the pill button
 *   note     small dim line under the button
 *   foot     the footer line, defaults to the shop address
 */
export function sheet({ site, tag, heading, lede, body = '', cta, note, foot }) {
  const mark = `${site}/email/mark-ink.png`
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>
<body style="margin:0;padding:0;background:${INK};font-family:${FONT};-webkit-font-smoothing:antialiased">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:${INK};padding:28px 12px"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;background:${PANEL};border:1px solid ${LINE};border-radius:16px;overflow:hidden">
  <tr><td style="background:${FRAME};padding:18px 28px;border-bottom:1px solid ${FRAME_LINE}">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
      <td style="vertical-align:middle"><table cellpadding="0" cellspacing="0" role="presentation"><tr><td style="vertical-align:middle;padding-right:8px"><img src="${mark}" alt="" width="56" height="32" style="display:block;width:56px;height:32px;border:0"></td><td style="vertical-align:middle;font-family:${HEAD};font-weight:600;font-size:22px;letter-spacing:.04em;text-transform:uppercase;color:${ON_FRAME};line-height:1">Fishbone</td></tr></table></td>
      <td style="text-align:right;vertical-align:middle">${label(esc(tag), EMBER)}</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:26px 28px 28px">
    <div style="width:44px;height:2px;background:${EMBER};border-radius:1px;margin:0 0 14px"></div>
    <h1 style="margin:0 0 6px;font-family:${HEAD};font-weight:600;font-size:28px;line-height:1.05;letter-spacing:.01em;text-transform:uppercase;color:${BONE}">${esc(heading)}</h1>
    ${lede ? `<p style="margin:0 0 22px;color:${MUTE};font-size:14px;font-weight:400;line-height:1.65">${lede}</p>` : '<div style="height:16px"></div>'}
    ${body}
    ${cta ? `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin:8px 0 22px"><tr><td align="center"><a href="${cta.href}" style="display:inline-block;background:${EMBER};color:${ON_EMBER};text-decoration:none;padding:14px 36px;border-radius:100px;font-family:${HEAD};font-weight:600;font-size:16px;letter-spacing:.06em;text-transform:uppercase">${esc(cta.label)}</a>${note ? `<div style="margin-top:12px;color:${DIM};font-size:11px">${note}</div>` : ''}</td></tr></table>` : ''}
    <div style="border-top:1px solid ${LINE};padding-top:16px">${label(foot || `Fishbone Graphics, 250 S Lena St, Ridgway, Colorado, ${PHONE}`, DIM)}</div>
  </td></tr>
</table>
<div style="max-width:600px;margin:14px auto 0;font-family:${MONO};font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:${DIM};text-align:center">Screen printing since 1985</div>
</td></tr></table></body></html>`
}

export async function send(key, payload, tag) {
  try {
    const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) console.error(`[mail:${tag}]`, res.status, await res.text())
    return res.ok
  } catch (err) {
    console.error(`[mail:${tag}]`, err.message)
    return false
  }
}
