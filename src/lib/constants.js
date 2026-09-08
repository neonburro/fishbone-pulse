/** Shop admin contact shown on public auth screens (mirrors settings.store.admin_email). */
export const ADMIN_CONTACT_EMAIL = 'fishbonegraphics@neonburro.com'
// The public site. The logo in the sidebar goes here. Netlify host until the
// domain moves, then fishbonegraphics.com, see docs/mail-and-dns.md.
export const STOREFRONT_URL = import.meta.env.VITE_SITE_URL || 'https://fishbonegraphics.netlify.app'

/** Courtesy ping to the shop admin. The row in Supabase is the record, this is the nudge. Never throws. */
export async function notifyAdmin(payload) {
  try {
    await fetch('/.netlify/functions/notify-admin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), keepalive: true })
  } catch {
    /* courtesy only */
  }
}
