import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Preview mode (layout review without Supabase):
 *   VITE_PULSE_PREVIEW=1 yarn dev
 * Swaps the data layer for in-memory fixtures in src/dev/preview via resolve.alias.
 * Registered ONLY for the dev server (`vite serve`); `vite build` never sees the alias,
 * so fixtures are unreachable from a production bundle.
 */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const preview = command === 'serve' && mode === 'development' && (process.env.VITE_PULSE_PREVIEW === '1' || env.VITE_PULSE_PREVIEW === '1')
  const previewDir = path.resolve(__dirname, 'src/dev/preview')

  if (preview) console.log('\n  Fishbone Pulse: PREVIEW MODE — fixture data, no Supabase\n')

  return {
    plugins: [react()],
    server: {
      port: 3002,
    },
    define: {
      // Some Supabase/realtime dependencies expect a Node-style `global`.
      global: 'globalThis',
    },
    resolve: {
      alias: preview
        ? [
            { find: /^(\.\.?\/)+lib\/api\/([a-zA-Z]+)$/, replacement: `${previewDir}/api/$2.js` },
            { find: /^(\.\.?\/)+store\/authStore$/, replacement: `${previewDir}/authStore.js` },
            { find: /^(\.\.?\/)+utils\/activityLogger$/, replacement: `${previewDir}/activityLogger.js` },
          ]
        : [],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            chakra: ['@chakra-ui/react', '@emotion/react', '@emotion/styled', 'framer-motion'],
            supabase: ['@supabase/supabase-js'],
          },
        },
      },
    },
  }
})
