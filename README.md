# Fishbone Pulse

Admin dashboard for **Fishbone Graphics & Screen Printing** (Ridgway, Colorado). Pulse is where the shop
reviews orders, opens customer artwork, tracks jobs through production, answers quote requests, curates the
storefront showcase and journal, and manages the catalog, settings and team. It runs against the same Supabase
project as the public storefront.

## Routes

| Route | Purpose |
| --- | --- |
| `/login/` | Username **or** email + password. Inline "Forgot your password?" sends a reset link. |
| `/request-account/` | Public form → `account_requests`. Admins approve from Settings → Team. |
| `/reset-password/` | Lands from the reset email; sets a new password, signs out, returns to login. |
| `/accept-invite/` | Lands from an invite email; pick display name, username and password. |
| `/` | Dashboard: needs review, in production, ready, new quotes, revenue MTD, showcase count, recent orders and activity. |
| `/orders`, `/orders/:id`, `/orders/:id/ticket` | Job board, order detail (items, size breakdowns, artwork via signed URLs, status, payment, notes, timeline), printable job ticket. |
| `/quotes` | Quote requests by status and request type, with every intake field and artwork. |
| `/customers` | Customers with order-history drawer. |
| `/products`, `/products/new`, `/products/:id` | Catalog CRUD: sizes, decoration methods, print locations, color variants, pricing tiers, image gallery. |
| `/categories` | Category CRUD with reorder and image. |
| `/showcase` | Home wall / work gallery / hero images: bulk upload, drag reorder, inline captions, accent color, visibility. |
| `/notes`, `/notes/new`, `/notes/:id` | Journal posts: Markdown editor with preview, cover image, tags, publish and pin. |
| `/settings` | Store, ordering, tax, shipping, payments, announcement, **Team** (invites, roles, account requests), **Account** (profile, password, info). |

Everything except the four public auth routes requires a session **and** a row in `admin_users`.

## Stack

Vite 6 · React 18 · Chakra UI v2 · framer-motion · react-router v6 · @supabase/supabase-js v2 · zustand · date-fns ·
marked + DOMPurify (journal preview). Fonts: Barlow Condensed (headings), Barlow (body), JetBrains Mono (order
numbers, SKUs, money).

## Environment variables

Copy `.env.example` to `.env` and fill in from Supabase → Project Settings → API:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

`.env` is gitignored. Never commit real keys. The anon key is safe in the browser because every table has
row-level security and admin writes are gated by `is_admin()` in Postgres.

## Scripts

```
yarn              # install
yarn dev          # http://localhost:3002
yarn dev:preview  # dev server with in-memory fixture data (layout review, no Supabase)
yarn build        # production build to dist/
yarn preview      # serve dist/ locally
yarn lint         # eslint
```

Requires Node 20+ (`.nvmrc` provided).

## Auth flow

1. **Sign in** (`/login/`): the identifier is passed to the anon-callable RPC `resolve_login(identifier)` which
   returns the account email for a username or email (or `null` → "Username not recognized"). Then
   `signInWithPassword`. After sign-in, `AuthProvider` (`src/hooks/useAuth.jsx`) loads the `admin_users` row
   (membership = access, `role` ∈ owner/admin/staff) and the `profiles` row (username, display name).
2. **Forgot password**: `resetPasswordForEmail(email, { redirectTo: <origin>/reset-password/ })`. The reset page
   reads `access_token`/`refresh_token` from the URL hash, calls `setSession`, clears the hash, updates the
   password, signs out and returns to login. Expired or reused links show a clear error.
3. **Invites** (Settings → Team): the `team-admin` Edge Function sends a Supabase invite whose link lands on
   `/accept-invite/`. The page consumes the hash session, pre-fills display name / username from user metadata,
   checks username availability live against `profiles`, sets the password, updates the profile, signs out.
   Works for both `invite` and `signup` link types.
4. **Account requests** (`/request-account/`): anon insert into `account_requests`. Admins approve (choosing a
   role) or decline from Settings → Team; approving sends the invite.
5. **Team management** goes through `supabase.functions.invoke('team-admin', { body })` with actions `list`,
   `invite`, `approve_request`, `decline_request`, `set_role`, `remove` (optionally deleting the login).

### Supabase Auth URL configuration

In the Supabase dashboard → Authentication → URL Configuration:

- **Site URL**: `https://fishbonepulse.netlify.app`
- **Redirect URLs**: `https://fishbonepulse.netlify.app/**` and `http://localhost:3002/**`

Without these, reset and invite links will not return to Pulse.

### Bootstrapping the first owner

1. Authentication → Users → **Add user** (email + password), or invite yourself.
2. SQL editor:

   ```sql
   select grant_admin('owner@example.com');
   ```

3. Sign in at `/login/`. Set your username under Settings → Account, then invite the rest of the crew from
   Settings → Team. Non-admin accounts see a "Not authorized for Pulse" screen with a sign-out button.

## Storage buckets used

- `product-images` (public) — product and variant photos at `products/<productId>/<timestamp>-<name>`.
- `site-media` (public) — category images at `categories/<key>/…`.
- `showcase` (public) — showcase images at `<placement>/<uuid>.<ext>`; width/height are read in the browser and stored on the row.
- `journal` (public) — post cover images at `covers/<uuid>.<ext>`.
- `artwork` (private) — customer uploads. Pulse mints a 1-hour signed URL per file from the `{path,name,size,type}`
  stored on `order_items.artwork_files` / `quote_requests.artwork_files`.

## Settings shape

`settings.store` is flat and read verbatim by the storefront:
`{ name, legal_name, tagline, founded, phone, email, admin_email, address1, address2, city, state, zip, map_url,
lat, lng, plus_code, directions_note, region, elevation_ft, landmarks:[{name,distance}], hours:[{days,open,close}],
instagram, facebook }`. Other keys: `tax {rate,label,note}`, `shipping {flat_rate,enabled,note}`,
`payments {provider, providers_available[], note}`, `ordering {turnaround_days, rush_available, min_order_note}`,
`announcement {enabled,text}`. Pulse always upserts these with `is_public = true`.

## Deploying (Netlify)

`netlify.toml` is included: build `yarn build`, publish `dist`, Node 20, SPA redirect to `index.html`
(`public/_redirects` covers the same for other static hosts). Set the two `VITE_*` environment variables in
the Netlify site settings and configure the Auth URLs above.

## Preview mode (fixtures)

`yarn dev:preview` (or `VITE_PULSE_PREVIEW=1 yarn dev`) runs the dev server with `src/lib/api/*`,
`src/hooks/useAuth.jsx` and `src/utils/activityLogger.js` swapped for the in-memory fixtures in
`src/dev/preview/` through a Vite alias. The alias is registered only for `vite serve`, every preview module
throws unless `import.meta.env.DEV` is true, and the real API modules never fall back to fixtures — when
Supabase is unreachable the UI shows error and empty states. See `src/dev/preview/README.md`.

## Notes for the next developer

- Order status changes write `order_events` through a database trigger; Pulse only updates `orders.status` and
  adds a row to `activity_log`.
- The logo is a placeholder wordmark in `src/components/brand/Logo.jsx` — swap that one file when the real
  logo arrives. `public/favicon.svg` is the matching mark.
- All data access is in `src/lib/api/*`. Pages never call Supabase directly (the Account tab's password change
  and the auth pages are the deliberate exceptions, since they drive `supabase.auth`).
- "Convert quote to order" is not built; see the TODO in `src/pages/Quotes.jsx`.
