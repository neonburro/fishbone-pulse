# Mail and DNS for Fishbone Graphics

How email leaves the site and Pulse, what is temporary, and the exact steps
to make it permanent. Read this before touching anything that sends.

Updated 2026-09-08.

## How mail works

Two Netlify functions send through Resend. Nothing else sends.

    storefront  netlify/functions/notify-admin.js
                shop notice + customer receipt for every form:
                contact, run request (quote), Pulse access request,
                quote accepted
    pulse       netlify/functions/send-quote.js
                the quote email with the /proof/<token>/ link, and the
                reminder (same function, reminder: true)
                netlify/functions/notify-admin.js is a copy, keep in step

Every email is printed on one sheet, netlify/functions/lib/mail.js, the
same file in both repos. It is built like Backstage: ink card, the nav
lockup top left, an orange label top right, panels for the details, a
pill button. The lockup is a PNG the storefront serves at
/email/lockup-ink.png (public/email/), rendered from the nav SVG because
mail clients strip SVG. No dot separators anywhere in mail, commas and
line breaks instead.

Every send has a shop side and a customer side. The record is already in
Supabase before any email goes out, so a mail failure never fails the form.
Requests still show in Pulse with no key at all.

## Env on both Netlify sites, never in git

Set the same values on fishbonegraphics and fishbonepulse.

    RESEND_API_KEY  key from the Resend team named Fishbone Graphics
    NOTIFY_FROM     Fishbone Graphics <hello@fishbone.neonburro.com>
    REPLY_TO        sales@fishbonegraphics.com
    ADMIN_TO        fishbonegraphics@neonburro.com  (comma separated for more)
    SITE_URL        https://fishbonegraphics.netlify.app
    PULSE_URL       https://fishbonepulse.netlify.app

Functions read env at build time. After changing any of these, trigger a
deploy on both sites or the old values keep running.

    netlify env:set NAME "value" --force     (inside the repo folder)
    netlify api createSiteBuild --data '{"site_id":"<id>"}'

Site ids: storefront 59a2ea29-4574-4576-8cf4-b0d210471f67, Pulse
df58d858-7026-4f37-aa62-d176f0c19c8c.

## What is temporary, and why

Mail sends as fishbone.neonburro.com, a subdomain of Neon Burro's domain,
verified in a Resend team called Fishbone Graphics that is separate from the
Neon Burro team. Reason: we do not have DNS access to fishbonegraphics.com
yet, and Resend will not verify a netlify.app host because Netlify owns
that DNS. neonburro.com itself stays in the Neon Burro team, claiming it
from the Fishbone team would revoke the main site's mail.

Customers see the name Fishbone Graphics and replies go to
sales@fishbonegraphics.com, so the sending address is invisible in
practice. It is still a Neon Burro address and it goes away at handoff.

## Making it permanent

The switch is small once DNS access exists.

1. In the Resend team Fishbone Graphics, add fishbonegraphics.com. Add the
   records it gives you (DKIM TXT, MX and SPF TXT on the send subdomain,
   DMARC if offered) to the domain's DNS. Wait for verified.
2. Set NOTIFY_FROM on both sites to
   Fishbone Graphics <hello@fishbonegraphics.com>, or whatever inbox Jack
   wants replies to look like they come from. REPLY_TO can then be the
   same address.
3. Set SITE_URL and PULSE_URL to the real hostnames once the custom
   domains are on Netlify. Also VITE_SITE_URL on the storefront, and the
   absolute URLs in both index.html files (canonical, og:url, og:image),
   which link previews read straight from the static file.
4. Redeploy both sites. Send one contact form and one quote as a test to
   fishbonegraphics@neonburro.com and confirm both emails on each.
5. Remove fishbone.neonburro.com from Resend and its records from
   neonburro.com DNS. Nothing else references it.

## What we know about the shop's DNS today

Looked up 2026-09-08 from outside.

    registrar   GoDaddy, domain registered 2001, renews Aug 2027
    nameservers GoDaddy (domaincontrol.com)
    site        WordPress on Scala Hosting, 209.142.64.35
    email       Microsoft 365 (MX fishbonegraphics-com.mail.protection.outlook.com)
    spf         v=spf1 include:secureserver.net -all  (points at GoDaddy mail,
                not Microsoft, so shop outbound mail may be failing SPF now)

## Where DNS should live

Recommendation: keep the domain registered at GoDaddy, move DNS to
Cloudflare in an account Jack owns, with Neon Burro invited as an
administrator. Do not transfer the registration, it locks the domain for
60 days and gains nothing.

Why Cloudflare over Netlify DNS or GoDaddy DNS:

- Resend and Netlify both configure Cloudflare records with one click.
- DNS stays put if the site ever moves off Netlify.
- The shop owns it. We hold a seat, we do not hold the keys.
- GoDaddy DNS works too, but the GoDaddy login is the one account we do
  not want to be dependent on, and every change is by hand.

Netlify DNS is the fallback if Jack does not want another account. It is
fine, it just ties DNS to the host.

## DNS move checklist

Whoever does the move, in this order, in one sitting.

1. Export every record from GoDaddy first. Screenshot the whole list.
2. Create the zone in Cloudflare and let it import. Check the import
   against the screenshot, it misses things.
3. Microsoft 365 must survive. Keep the MX, the autodiscover CNAME, the
   onmicrosoft.com TXT and any DKIM selector records exactly. Fix the SPF
   to  v=spf1 include:spf.protection.outlook.com -all  while you are
   there.
4. Add the Netlify records for the storefront (apex and www) and for
   pulse.fishbonegraphics.com, then add both custom domains on their
   Netlify sites and let Netlify issue certificates.
5. Add the Resend records for fishbonegraphics.com.
6. Change nameservers at GoDaddy to the two Cloudflare gives you.
7. Wait for propagation, then send a test email from the shop's Microsoft
   365 account and a test form through the site. Both must arrive.
8. Only then follow "Making it permanent" above.

Keep the WordPress site up until the new site is on the domain. Cancel
Scala Hosting, YooTheme Pro and the DJ plugins after, not before.

## Login emails from Supabase

Invites, password resets, magic links and email confirmations are sent by
Supabase Auth, not by our functions. Set on 2026-09-08 in the Supabase
dashboard, Authentication, Emails:

- SMTP Settings: custom SMTP on, sender hello@fishbone.neonburro.com,
  name Fishbone Graphics, host smtp.resend.com, port 465, user resend,
  password is the Resend API key. Change the sender with the domain at
  handoff, same as NOTIFY_FROM.
- Templates: invite, confirm sign up, magic link, reset password and
  change email are on the same sheet as lib/mail.js, with the mark from
  /email/mark-ink.png and {{ .ConfirmationURL }} on the button. The
  source for them is the sheet in lib/mail.js, if it changes, paste the
  five again. Subjects end with ", Fishbone Backstage".
