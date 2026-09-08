import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, Drawer, DrawerContent, DrawerOverlay, Flex, useDisclosure } from '@chakra-ui/react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import MessagesDrawer from '../crew/MessagesDrawer'
import ErrorBoundary from '../common/ErrorBoundary'
import usePresence from '../../hooks/usePresence'
import { useAuth } from '../../hooks/useAuth'
import { countUnread, subscribeMessages } from '../../lib/api/crew'
import { getOrderStats } from '../../lib/api/orders'
import { countNewQuotes } from '../../lib/api/quotes'

const SIDEBAR_W = '240px'
// Dev-only: true when the Vite dev server runs with VITE_PULSE_PREVIEW=1 (fixture data, see src/dev/preview).
const PREVIEW_MODE = import.meta.env.DEV && import.meta.env.VITE_PULSE_PREVIEW === '1'

export default function Layout() {
  const menu = useDisclosure()
  const messages = useDisclosure()
  const { user } = useAuth()
  usePresence(user?.id)
  const [partner, setPartner] = useState(null)
  const [unread, setUnread] = useState(0)
  const location = useLocation()
  const [badges, setBadges] = useState({})

  // Close the mobile drawer on navigation
  useEffect(() => {
    menu.onClose()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  // Sidebar badge counts (needs review / new quotes) — refreshed on route change
  useEffect(() => {
    let cancelled = false
    Promise.all([getOrderStats(), countNewQuotes()])
      .then(([stats, quotes]) => {
        if (!cancelled) setBadges({ '/orders': stats.needsReview, '/quotes': quotes })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [location.pathname])

  // unread messages: live on every message event, plus a slow poll as a net
  useEffect(() => {
    if (!user?.id) return undefined
    let alive = true
    const load = () => countUnread(user.id).then((n) => alive && setUnread(n)).catch(() => {})
    load()
    const off = subscribeMessages(user.id, load)
    const t = setInterval(load, 5 * 60 * 1000)
    return () => { alive = false; off(); clearInterval(t) }
  }, [user?.id, location.pathname, messages.isOpen])

  const openMessages = (member) => { setPartner(member || null); messages.onOpen() }

  return (
    <Flex minH="100vh" bg="paper">
      <Box
        as="aside"
        w={SIDEBAR_W}
        flexShrink={0}
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        display={{ base: 'none', lg: 'block' }}
        zIndex={20}
      >
        <Sidebar badges={badges} />
      </Box>

      <Drawer isOpen={menu.isOpen} placement="left" onClose={menu.onClose} size="xs">
        <DrawerOverlay />
        <DrawerContent maxW="260px">
          <Sidebar onNavigate={menu.onClose} badges={badges} />
        </DrawerContent>
      </Drawer>

      <Box flex="1" ml={{ base: 0, lg: SIDEBAR_W }} minW={0}>
        {PREVIEW_MODE && (
          <Box bg="hivis.400" color="ink.900" fontFamily="mono" fontSize="11px" textAlign="center" py={0.5} letterSpacing="0.04em">
            PREVIEW MODE · fixture data · not connected to Supabase
          </Box>
        )}
        <TopBar onOpenMenu={menu.onOpen} onOpenMessages={openMessages} unread={unread} />
        {/* Same left padding as the search field in TopBar. Content lines up with it. */}
        <Box as="main" px={{ base: 4, md: 6 }} py={{ base: 5, md: 6 }} maxW="1600px">
          <ErrorBoundary resetKey={location.pathname}>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>

      <MessagesDrawer isOpen={messages.isOpen} onClose={messages.onClose} initialPartner={partner} />

    </Flex>
  )
}
