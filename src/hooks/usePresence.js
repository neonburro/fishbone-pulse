// src/hooks/usePresence.js
//
// The heartbeat. Stamps profiles.last_seen_at on mount and every two
// minutes while the tab is visible, so the online strip can show who is
// backstage. Silent on failure, presence is not worth an error.

import { useEffect } from 'react'
import { heartbeat } from '../lib/api/crew'

const EVERY = 2 * 60 * 1000

export default function usePresence(userId) {
  useEffect(() => {
    if (!userId) return undefined
    let timer = null
    const beat = () => heartbeat(userId).catch(() => {})
    const start = () => { beat(); timer = setInterval(beat, EVERY) }
    const stop = () => { if (timer) clearInterval(timer); timer = null }
    const onVis = () => (document.hidden ? stop() : start())
    start()
    document.addEventListener('visibilitychange', onVis)
    return () => { stop(); document.removeEventListener('visibilitychange', onVis) }
  }, [userId])
}
