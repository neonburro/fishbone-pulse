# Fishbone Pulse, the plan

Backstage for the shop. Paper UI, the same ink and red as the storefront,
the oval logo on the login. This is the working plan for the next phases.
It is written before the code so the code has something to be checked
against. Updated 2026-09-07.

## Words

Runs (custom bulk orders), Requests (everything that comes through a form),
The rack (printed stock for sale one at a time), Prints (designs with screens
on file), The wall (showcase photos), Blanks (the garment catalog), Stock
(counts on the shelf), Calendar.

## Phase A, access and the look

- Login, forgot password and request access already exist. Forgot password
  goes through the Supabase mailer to the person. Request access files an
  account_requests row and now pings the admin through the notify-admin
  Netlify function (Resend, from the neonburro.com domain until
  fishbonegraphics.com is verified there). Admin approves inside Pulse.
- Retune the theme to the storefront tokens: paper ground, ink type, red
  #EC1D3B the only accent, Barlow Condensed and Barlow, radii 8 12 18.
- The login left panel carries the ink share card art (public/og-ink.png
  from the storefront) and the oval logo.
- Env on the Netlify site: RESEND_API_KEY, ADMIN_TO (defaults to
  fishbonegraphics@neonburro.com). Never in git.

## Done on 2026-09-07 (local, not deployed)

- Theme matched to the storefront with orange as the accent. Login tidied.
- Stock: tables blank_colors, stock_items, stock_moves, view stock_levels.
  Screens /stock and /stock/:id with the move drawer (initials required)
  and the item drawer (each or dozen, par, sell price, off the pile).
- blank_colors holds 455 colors across 9 styles crawled from Sportswear
  Collection with a hex averaged from each swatch photo. Bella 3001 and
  3480 are not in that catalog.
- Pricing tab in Settings: show prices switch, size upcharges (2XL to 5XL)
  that place_order applies server side, setup and per location fees.
  Every price in the database is zero until the shop gives real numbers
  and the storefront says "priced on proof" while it is.
- Crew: presence heartbeat on profiles.last_seen_at, online strip in the
  top bar, avatar picker in Settings, you at the bottom of the sidebar as
  the door to Settings, direct_messages table and a messages drawer.
- Search is a rounded field with a dropdown of runs and blanks.
- notify-admin Netlify function for access requests.
- Runs and requests are linked both ways. A request has "Start a run from
  this" (rpc start_run_from_request, admin only) which makes or finds the
  customer, opens the run in pending_review with the contact, date and note
  carried over, and logs it. The run page shows a "Came from" card with the
  request and its files, and the customer card links to every run they did.

- The quote. A run has Send the quote: issue_quote mints a 30 day token
  and moves pending_review to quoted, the send-quote Netlify function
  emails the customer a link to /proof/<token>/ on the storefront, where
  get_quote_by_token shows the job ticket and accept_quote records the
  acceptance, moves the run to awaiting_payment, logs it, and the storefront
  pings notify-admin with kind quote_accepted so the shop gets an email.
- Preview fixtures narrowed to three recent jobs.

## Phase B, stock

Two kinds of things on a shelf and one ledger.

    blanks            the catalog. brand, style, color, sizes, supplier link.
                      imported from Sportswear Collection. no counts here.
    stock_items       a thing you count. either a blank (style + color) or a
                      printed design (design + blank + color). unit is
                      'dozen' or 'each', both shown everywhere. par level
                      for the low warning.
    stock_moves       the ledger. every in and every out. quantity in the
                      item's unit, direction, reason (received, pulled for
                      run, sold from rack, misprint, count adjust), the
                      run or order it belongs to if any, initials, note,
                      created_at. counts are never edited, only moved.
    designs           art on file. name, client, screens burned, color
                      count, blanks it prints on, last run, files.

Rules
- The count on a stock item is the sum of its moves. A recount is a move
  with reason 'count adjust' and the difference.
- Pulling blanks for a run asks for initials before it saves. Initials and
  the timestamp show in the ledger and on the run.
- A rack sale on the storefront writes a stock_move on payment.
- Dozens or each is per item. Entry accepts either and converts.
- Low stock (below par) shows on the dashboard and on the calendar as a
  reorder suggestion.

Screens
- /stock/ the shelf. one row per item, count, unit, par, last move.
- /stock/:id/ the item and its ledger.
- Move drawer. in or out, quantity, reason, initials, note. Two taps.
- /blanks/ the catalog with the importer (Phase C).
- /prints/ designs on file, which become Available prints on the storefront.

## Phase C, the blanks importer

Sportswear Collection is Cloudflare gated, so the importer runs in the
browser, not on a server. A Pulse screen takes a style URL, fetches it
through the signed in user's browser tab (a bookmarklet or a small
extension step), reads the color swatches (name plus swatch photo), sizes
and product photos, averages each swatch photo to a hex, and writes
products and product_variants. The shop's usual blanks get a flag so the
storefront shows them first and links out to the full catalog.

## Phase D, runs and requests

- Every form on the storefront lands in quote_requests. Pulse shows them as
  Requests, newest first, with the files previewed through signed URLs from
  the artwork bucket.
- A request becomes a run in one tap. The run keeps the link back to the
  request so the trail from first call to pickup is one page.
- Runs board: proof, approved, on press, boxed, picked up. Job ticket print
  view exists already.
- Calls and notes on a request or a run, with initials and time.

## Phase E, the wall and the rack

- /wall/ upload photos into the showcase bucket, reorder, caption, choose
  home or work. Replaces src/data/work.js on the storefront the moment the
  first row lands.
- /rack/ printed stock for sale one at a time. A stock item with a price
  and a photo. Sizes on hand from the ledger. Sold from the storefront
  under Available prints, next to the print to order designs.

## Phase F, the calendar

One events table, two audiences.

    events    title, kind (festival, show, delivery, due, press, arrival,
              reorder, other), starts_at, ends_at, all_day, place, run_id,
              request_id, stock_item_id, public (bool), notes, created_by.

- Pulse shows everything, full screen, month and week, clickable, drag to
  move. Runs due, blanks arriving, jobs on press, low stock reorders.
- The storefront shows only public rows: the festivals and shows the shop
  prints for. People come to Fishbone to see what is in town. Each public
  event links to the wall photos tagged with it.
- A run with a due date makes its own event. Delete the run, the event goes.

## Later

- Payments: Stripe or Square through the storefront abstraction.
- Auth emails through Resend once fishbonegraphics.com is verified there.
- Transcription or call logging only if the shop asks for it.

- The plus button. New run in the top bar opens a short form (who, how
  to reach them, needed by, pickup or ship, what they said) and rpc
  start_run_manual opens the run in pending_review and lands you on it.
  Lines are added on the run: pick a catalog blank, a color from the
  blank_colors swatches or type one with a hex, where the ink goes,
  quantity, unit price, sizes. recalc_order_totals redoes the totals.
- Numbers are FB-YYMM-NNN, restarting each month, like Cimarron.
- Send a reminder on a sent quote reuses send-quote with reminder wording
  and logs a quote_reminder event.
- Trash. Runs and requests get deleted_at and deleted_by. Trash asks for
  two letters and the row leaves the lists. /trash shows what is there,
  who and when, with Bring back, select all and Delete forever (initials
  again, this one is real).
- Stock items can pick the catalog blank, then the catalog colors show
  as swatches with a color picker for the hex, sizes come from a list, and
  a new item takes an opening count with initials into the ledger. A
  blank tied to a catalog product calls ensure_variant so that color
  appears on the storefront under that blank.

- 2026-09-08, the long pass. Storefront: the hero is a place line, one
  sentence on what and one on who, five doors (Start a run, Send your art,
  Share your vision, See the work, Available prints). /design/ is the
  design door and lands in Requests as request_type design with its own
  mail. No badges, no minimums, no "24 and up". Runs shows the racks and
  the three blanks the shop keeps (Comfort Colors 1717, Gildan 5000,
  Gildan 18000), every other product is inactive until the shop turns it
  on in Backstage. Price tables hide while every number is zero.
  Toasts on the theme in both apps. Mail on the Backstage sheet, ink
  frame, paper room, white cards. Supabase login mail on the same sheet
  through Resend. Owner fishbonegraphics@neonburro.com, Tyler is admin.
  Briefs for the shop in the storefront repo, docs/brief.
