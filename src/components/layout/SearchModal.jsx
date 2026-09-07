import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Kbd,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FiSearch, FiClipboard, FiTag } from 'react-icons/fi'
import { searchOrders } from '../../lib/api/orders'
import { searchProducts } from '../../lib/api/products'
import { OrderStatusBadge } from '../common/StatusBadge'
import Mono from '../common/Mono'
import { formatMoney } from '../../utils/money'

export default function SearchModal({ isOpen, onClose }) {
  const [term, setTerm] = useState('')
  const [orders, setOrders] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isOpen) {
      setTerm('')
      setOrders([])
      setProducts([])
      setError('')
    }
  }, [isOpen])

  useEffect(() => {
    const t = term.trim()
    if (t.length < 2) {
      setOrders([])
      setProducts([])
      return
    }
    let cancelled = false
    setLoading(true)
    const handle = setTimeout(async () => {
      try {
        const [o, p] = await Promise.all([searchOrders(t), searchProducts(t)])
        if (!cancelled) {
          setOrders(o)
          setProducts(p)
          setError('')
          setActive(0)
        }
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(handle)
    }
  }, [term])

  const results = [
    ...orders.map((o) => ({ kind: 'order', id: o.id, to: `/orders/${o.id}`, row: o })),
    ...products.map((p) => ({ kind: 'product', id: p.id, to: `/products/${p.id}`, row: p })),
  ]

  const go = (r) => {
    onClose()
    navigate(r.to)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(results.length - 1, a + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(0, a - 1))
    } else if (e.key === 'Enter' && results[active]) {
      go(results[active])
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} initialFocusRef={inputRef} size="lg" motionPreset="slideInTop">
      <ModalOverlay bg="rgba(11,11,12,0.55)" />
      <ModalContent mt={{ base: 4, md: 20 }} mx={3} overflow="hidden">
        <Box borderBottom="1px solid" borderColor="bone.200">
          <InputGroup size="lg">
            <InputLeftElement pointerEvents="none" color="ink.300">
              {loading ? <Spinner size="sm" color="ember.500" /> : <FiSearch />}
            </InputLeftElement>
            <Input
              ref={inputRef}
              variant="unstyled"
              pl={12}
              pr={4}
              h="56px"
              placeholder="Search orders by number or email, products by name"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label="Search"
            />
          </InputGroup>
        </Box>
        <ModalBody p={0} maxH="60vh" overflowY="auto">
          {error && (
            <Text p={4} fontSize="sm" color="red.600">
              {error}
            </Text>
          )}
          {!error && term.trim().length < 2 && (
            <HStack p={4} fontSize="sm" color="ink.500" justify="space-between">
              <Text>Type at least two characters. Try an order number like FB-26-01001.</Text>
              <HStack spacing={1} display={{ base: 'none', md: 'flex' }}>
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <Kbd>Enter</Kbd>
              </HStack>
            </HStack>
          )}
          {!error && term.trim().length >= 2 && !loading && results.length === 0 && (
            <Text p={4} fontSize="sm" color="ink.500">
              No orders or products match “{term}”.
            </Text>
          )}
          <VStack align="stretch" spacing={0} role="listbox">
            {results.map((r, i) => (
              <HStack
                key={`${r.kind}-${r.id}`}
                role="option"
                aria-selected={i === active}
                px={4}
                py={3}
                cursor="pointer"
                bg={i === active ? 'paper2' : 'transparent'}
                _hover={{ bg: 'paper2' }}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
                spacing={3}
              >
                <Box as={r.kind === 'order' ? FiClipboard : FiTag} color="ink.300" flexShrink={0} />
                {r.kind === 'order' ? (
                  <>
                    <Mono fontWeight={500}>{r.row.order_number}</Mono>
                    <Text fontSize="sm" color="ink.500" flex="1" noOfLines={1}>
                      {r.row.contact?.name || '—'} · {r.row.contact?.email || ''}
                    </Text>
                    <OrderStatusBadge status={r.row.status} />
                    <Mono color="ink.500">{formatMoney(r.row.total)}</Mono>
                  </>
                ) : (
                  <>
                    <Text fontSize="sm" fontWeight={500} flex="1" noOfLines={1}>
                      {r.row.name}
                    </Text>
                    <Text fontSize="xs" color="ink.300">
                      {r.row.is_active ? 'Product' : 'Hidden product'}
                    </Text>
                    <Mono color="ink.500">{formatMoney(r.row.base_price)}</Mono>
                  </>
                )}
              </HStack>
            ))}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
