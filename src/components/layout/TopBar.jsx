// src/components/layout/TopBar.jsx
//
// The bar across the top of the workspace. Left, a rounded search field
// that drops results under it as you type, runs and blanks. Right, who is
// backstage right now and the messages button. Your own face is not up
// here, it lives at the bottom of the sidebar and it opens Settings.
//
// The main content below the bar starts at the same left edge as the
// search field. Layout.jsx carries the same padding, keep them in step.

import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Button, HStack, IconButton, Input, InputGroup, InputLeftElement, Kbd, Spinner, Text, useDisclosure, useOutsideClick } from '@chakra-ui/react'
import { FiMenu, FiSearch, FiMessageSquare, FiClipboard, FiTag, FiPlus } from 'react-icons/fi'
import NewRunDrawer from '../runs/NewRunDrawer'
import { searchOrders } from '../../lib/api/orders'
import { searchProducts } from '../../lib/api/products'
import { OrderStatusBadge } from '../common/StatusBadge'
import Mono from '../common/Mono'
import OnlineStrip from '../crew/OnlineStrip'
import { useAuth } from '../../hooks/useAuth'

export default function TopBar({ onOpenMenu, onOpenMessages, unread = 0 }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const newRun = useDisclosure()
  useOutsideClick({ ref: boxRef, handler: () => setOpen(false) })

  useEffect(() => {
    const t = term.trim()
    if (t.length < 2) { setOrders([]); setProducts([]); return undefined }
    let cancelled = false
    setLoading(true)
    const h = setTimeout(async () => {
      try {
        const [o, p] = await Promise.all([searchOrders(t), searchProducts(t)])
        if (!cancelled) { setOrders(o || []); setProducts(p || []); setOpen(true) }
      } catch { /* quiet */ } finally { if (!cancelled) setLoading(false) }
    }, 220)
    return () => { cancelled = true; clearTimeout(h) }
  }, [term])

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target?.isContentEditable
      if (e.key === '/' && !typing) { e.preventDefault(); inputRef.current?.focus() }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const go = (to) => { setOpen(false); setTerm(''); navigate(to) }
  const hasResults = orders.length + products.length > 0

  return (
    <HStack as="header" h="64px" px={{ base: 4, md: 6 }} spacing={3} bg="paper" position="sticky" top={0} zIndex={10} borderBottom="1px solid" borderColor="bone.200">
      <IconButton aria-label="Open navigation" icon={<FiMenu />} variant="ghost" display={{ base: 'inline-flex', lg: 'none' }} onClick={onOpenMenu} />

      <Box ref={boxRef} position="relative" flex="1" maxW="520px">
        <InputGroup>
          <InputLeftElement pointerEvents="none" color="ink.400" h="40px"><FiSearch /></InputLeftElement>
          <Input
            ref={inputRef}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onFocus={() => term.trim().length >= 2 && setOpen(true)}
            placeholder="Search runs, people, blanks"
            h="40px"
            bg="white"
            borderColor="bone.200"
            borderRadius="md"
            pr="44px"
            _focusVisible={{ borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' }}
          />
          <Box position="absolute" right="10px" top="50%" transform="translateY(-50%)" display={{ base: 'none', md: 'block' }} pointerEvents="none">
            {loading ? <Spinner size="xs" color="ember.500" /> : <Kbd fontSize="10px" bg="paper2" borderColor="bone.200">/</Kbd>}
          </Box>
        </InputGroup>
        {open && term.trim().length >= 2 && (
          <Box position="absolute" top="calc(100% + 6px)" left={0} right={0} bg="white" borderRadius="md" boxShadow="0 16px 40px rgba(22,22,24,0.14), 0 0 0 1px rgba(22,22,24,0.06)" overflow="hidden" zIndex={30}>
            {!hasResults && !loading && <Text px={4} py={3} fontSize="sm" color="ink.500">Nothing for "{term.trim()}" yet.</Text>}
            {orders.length > 0 && (
              <Box>
                <Text px={4} pt={3} pb={1} fontFamily="mono" fontSize="10px" letterSpacing="0.16em" textTransform="uppercase" color="ink.400">Runs</Text>
                {orders.slice(0, 6).map((o) => (
                  <HStack key={o.id} as="button" type="button" w="100%" textAlign="left" px={4} py={2} spacing={3} _hover={{ bg: 'paper2' }} onClick={() => go(`/orders/${o.id}`)}>
                    <Box color="ink.400"><FiClipboard size={14} /></Box>
                    <Mono fontSize="xs">{o.order_number}</Mono>
                    <Text fontSize="sm" flex={1} noOfLines={1}>{o.contact?.name || o.contact?.email || ''}</Text>
                    <OrderStatusBadge status={o.status} />
                  </HStack>
                ))}
              </Box>
            )}
            {products.length > 0 && (
              <Box borderTop={orders.length ? '1px solid' : undefined} borderColor="bone.200">
                <Text px={4} pt={3} pb={1} fontFamily="mono" fontSize="10px" letterSpacing="0.16em" textTransform="uppercase" color="ink.400">Blanks</Text>
                {products.slice(0, 6).map((p) => (
                  <HStack key={p.id} as="button" type="button" w="100%" textAlign="left" px={4} py={2} spacing={3} _hover={{ bg: 'paper2' }} onClick={() => go(`/products/${p.id}`)}>
                    <Box color="ink.400"><FiTag size={14} /></Box>
                    <Text fontSize="sm" flex={1} noOfLines={1}>{p.name}</Text>
                    <Mono fontSize="xs" color="ink.400">{[p.brand, p.style_number].filter(Boolean).join(' ')}</Mono>
                  </HStack>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      <Box flex="1" />

      <HStack spacing={3}>
        <Button size="sm" leftIcon={<FiPlus />} borderRadius="full" onClick={newRun.onOpen}>New run</Button>
        <Box display={{ base: 'none', md: 'block' }}><OnlineStrip currentUserId={user?.id} onPick={(m) => onOpenMessages?.(m)} /></Box>
        <Box position="relative">
          <IconButton aria-label="Messages" icon={<FiMessageSquare />} variant="outline" borderRadius="full" onClick={() => onOpenMessages?.(null)} />
          {unread > 0 && <Box position="absolute" top="-3px" right="-3px" minW="18px" h="18px" px={1} borderRadius="full" bg="ember.500" color="#161618" fontFamily="mono" fontSize="10px" display="grid" placeItems="center" border="2px solid" borderColor="paper">{unread}</Box>}
        </Box>
      </HStack>
      <NewRunDrawer isOpen={newRun.isOpen} onClose={newRun.onClose} />
    </HStack>
  )
}
