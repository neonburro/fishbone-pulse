# Preview fixtures (development only)

`VITE_PULSE_PREVIEW=1 yarn dev` (or `yarn dev:preview`) swaps `src/lib/api/*`, `src/hooks/useAuth.jsx`
and `src/utils/activityLogger.js` for the in-memory modules in this folder via a Vite `resolve.alias`
that is only registered when the dev server (`vite serve`) is running with that flag.

- `yarn build` never registers the alias, so nothing in this folder is reachable from a production bundle.
- Every module here also throws at import time unless `import.meta.env.DEV` is true.
- The real API modules have no fallback to fixtures; when Supabase is unreachable they surface an error state.

Use it to review layout without a live Supabase session.
