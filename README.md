# Fishbone Pulse

Admin dashboard for **Fishbone Graphics & Screen Printing** (Ridgway, Colorado). Pulse is where the shop
reviews orders, opens customer artwork, tracks jobs through production, answers quote requests, and manages
the storefront catalog and settings. It runs against the same Supabase project as the public storefront.

## What it does

| Route | Purpose |
| --- | --- |
| `/login` | Email + password sign-in. Only accounts listed in `admin_users` get past this screen. |
| `/` | Dashboard: needs-review count, in production, ready for pickup, new quotes, revenue MTD, recent orders and activity. |
| `/orders` | All orders with status tabs, search by order number or customer email, pagination. |
| `/orders/:id` | Order detail: items with size breakdowns, artwork (signed URLs), status and payment selects, notes, timeline. |
| `/orders/:id/ticket` | Print-friendly job ticket for the press. |
| `/quotes` | Quote requests with status and internal notes. |
| `/customers` | Customer list with order history drawer. |
| `/products`, `/products/new`, `/products/:id` | Catalog CRUD: basics, sizes, decoration methods, print locations, color variants, pricing tiers, image gallery. |
| `/categories` | Category CRUD with reorder, image, visibility. |
| `/settings` | Store info, ordering, tax, shipping, payments provider, announcement bar, admins list, change password. |

## Stack

Vite 6 · React 18 · Chakra UI v2 · framer-motion · react-router v6 · @supabase/supabase-js v2 · zustand · date-fns.
Fonts: Barlow Condensed (headings), Barlow (body), JetBrains Mono (order numbers, SKUs, money).

## Environment variables

Copy `.env.example` to `.env` and fill in from Supabase → Project Settings → API:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

`.env` is gitignored. Never commit real keys. The anon key is safe for the browser because every table has
row-level security and admin writes are gated by `is_admin()` in Postgres.

## Scripts

```
yarn            # install
yarn dev        # http://localhost:3002
yarn build      # production build to dist/
yarn preview    # serve dist/ locally
yarn lint       # eslint
yarn dev:preview  # dev server with in-memory fixture data (layout review, no Supabase)
```

Requires Node 20+ (`.nvmrc` provided).

## Granting the first admin

Pulse checks `admin_users` after sign-in. To add someone:

1. Supabase dashboard → Authentication → Users → **Add user** (email + password).
2. SQL editor:

   ```sql
   select grant_admin('owner@fishbonegraphics.com');
   ```

3. They sign in at `/login`. Non-admin accounts see a "Not authorized for Pulse" screen with a sign-out button.

To revoke access, delete the row from `admin_users`.

## Storage buckets used

- `product-images` (public) — product and variant photos, uploaded to `products/<productId>/<timestamp>-<name>`.
- `site-media` (public) — category images, uploaded to `categories/<key>/…`.
- `artwork` (private) — customer uploads. Pulse never lists this bucket; it mints a 1-hour signed URL per file
  from the `{path,name,size,type}` stored on `order_items.artwork_files` / `quote_requests.artwork_files`.

## Deploying (Netlify)

`netlify.toml` is included: build `yarn build`, publish `dist`, Node 20, SPA redirect to `index.html`
(`public/_redirects` covers the same for other static hosts). Set the two `VITE_*` environment variables in
the Netlify site settings. Point a subdomain such as `pulse.fishbonegraphics.com` at the site.

## Preview mode (fixtures)

`yarn dev:preview` (or `VITE_PULSE_PREVIEW=1 yarn dev`) runs the dev server with `src/lib/api/*`,
`src/store/authStore.js` and `src/utils/activityLogger.js` swapped for the in-memory fixtures in
`src/dev/preview/` through a Vite alias. The alias is registered only for `vite serve`, every preview module
throws unless `import.meta.env.DEV` is true, and the real API modules never fall back to fixtures — when
Supabase is unreachable the UI shows error and empty states. See `src/dev/preview/README.md`.

## Notes for the next developer

- Status changes write `order_events` through a database trigger; Pulse only updates `orders.status` and
  adds a row to `activity_log`.
- The logo is a placeholder wordmark in `src/components/brand/Logo.jsx` — swap that one file when the real
  logo arrives. `public/favicon.svg` is the matching mark.
- All data access is in `src/lib/api/*`. Pages never call Supabase directly.
