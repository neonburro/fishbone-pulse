import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Box, Drawer, DrawerContent, DrawerOverlay, Flex, useDisclosure } from '@chakra-ui/react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import SearchModal from './SearchModal'
import { getOrderStats } from '../../lib/api/orders'
import { countNewQuotes } from '../../lib/api/quotes'

const SIDEBAR_W = '240px'
// Dev-only: true when the Vite dev server runs with VITE_PULSE_PREVIEW=1 (fixture data, see src/dev/preview).
const PREVIEW_MODE = import.meta.env.DEV && import.meta.env.VITE_PULSE_PREVIEW === '1'

export default function Layout() {
  const menu = useDisclosure()
  const search = useDisclosure()
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

  // "/" opens search when not typing in a field
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable
      if (e.key === '/' && !typing && !search.isOpen) {
        e.preventDefault()
        search.onOpen()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [search])

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
        <TopBar onOpenMenu={menu.onOpen} onOpenSearch={search.onOpen} />
        <Box as="main" px={{ base: 4, md: 6, xl: 8 }} py={{ base: 5, md: 6 }} maxW="1440px" mx="auto">
          <Outlet />
        </Box>
      </Box>

      <SearchModal isOpen={search.isOpen} onClose={search.onClose} />

    </Flex>
  )
}
