import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import {
  Avatar,
  Box,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Link,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import SearchInput from '../components/common/SearchInput'
import Pagination from '../components/common/Pagination'
import TableSkeleton from '../components/common/TableSkeleton'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import MotionFade from '../components/common/MotionFade'
import Mono from '../components/common/Mono'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/StatusBadge'
import { getCustomer, listCustomers, ordersForCustomer, updateCustomerNotes } from '../lib/api/customers'
import { formatMoney } from '../utils/money'
import { formatDate } from '../utils/format'

export default function Customers() {
  const [params, setParams] = useSearchParams()
  const page = parseInt(params.get('page') || '1', 10)
  const openId = params.get('open')
  const [search, setSearch] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [orders, setOrders] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResult(await listCustomers({ search, page }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  // open drawer from ?open=<id> (linked from order detail)
  useEffect(() => {
    if (!openId) {
      setSelected(null)
      return
    }
    let cancelled = false
    setOrders(null)
    getCustomer(openId)
      .then((c) => {
        if (cancelled || !c) return
        setSelected(c)
        setNotes(c.notes || '')
        return ordersForCustomer(c.id).then((o) => !cancelled && setOrders(o))
      })
      .catch((err) => toast({ title: 'Could not load customer', description: err.message, status: 'error' }))
    return () => {
      cancelled = true
    }
  }, [openId, toast])

  const open = (c) => {
    const next = new URLSearchParams(params)
    next.set('open', c.id)
    setParams(next, { replace: true })
  }
  const close = () => {
    const next = new URLSearchParams(params)
    next.delete('open')
    setParams(next, { replace: true })
  }

  const saveNotes = async () => {
    if (!selected || notes === (selected.notes || '')) return
    setSaving(true)
    try {
      await updateCustomerNotes(selected.id, notes)
      setSelected((c) => ({ ...c, notes }))
      toast({ title: 'Customer notes saved', status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not save notes', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const lifetime = orders ? orders.filter((o) => o.payment_status === 'paid').reduce((a, o) => a + (parseFloat(o.total) || 0), 0) : 0

  return (
    <MotionFade>
      <PageHeader
        eyebrow="People"
        title="Customers"
        description="Everyone who has placed an order. Click a row to see their order history and notes."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Name, email, company or phone" />}
      />

      <Card p={0}>
        {error ? (
          <Box p={4}>
            <ErrorState message={error} onRetry={load} />
          </Box>
        ) : loading && !result ? (
          <TableSkeleton rows={6} />
        ) : result?.rows.length === 0 ? (
          <EmptyState title="No customers yet" description="A customer record is created automatically the first time someone places an order." />
        ) : (
          <Box overflowX="auto" opacity={loading ? 0.6 : 1}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Company</Th>
                  <Th>Phone</Th>
                  <Th isNumeric>Orders</Th>
                  <Th>Since</Th>
                </Tr>
              </Thead>
              <Tbody>
                {result.rows.map((c) => (
                  <Tr key={c.id} cursor="pointer" _hover={{ bg: 'paper2' }} onClick={() => open(c)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && open(c)}>
                    <Td>
                      <HStack spacing={3}>
                        <Avatar size="sm" name={c.name || c.email} bg="river.500" color="white" />
                        <Box>
                          <Text fontWeight={600}>{c.name || '—'}</Text>
                          <Text fontSize="xs" color="ink.500">
                            {c.email}
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>{c.company || <Text color="ink.300">—</Text>}</Td>
                    <Td fontFamily="mono" fontSize="xs">
                      {c.phone || <Text color="ink.300">—</Text>}
                    </Td>
                    <Td isNumeric>
                      <Mono>{c.orders?.[0]?.count ?? 0}</Mono>
                    </Td>
                    <Td color="ink.500" whiteSpace="nowrap">
                      {formatDate(c.created_at)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
      {result && (
        <Pagination
          page={result.page}
          pageSize={result.pageSize}
          count={result.count}
          onChange={(p) => {
            const next = new URLSearchParams(params)
            if (p === 1) next.delete('page')
            else next.set('page', String(p))
            setParams(next, { replace: true })
          }}
        />
      )}

      <Drawer isOpen={Boolean(openId)} onClose={close} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader pr={12}>
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" color="ink.500" fontWeight={600}>
              Customer
            </Text>
            {selected?.name || selected?.email || <Skeleton h="24px" w="180px" />}
          </DrawerHeader>
          <DrawerBody>
            {selected ? (
              <Stack spacing={5}>
                <Grid templateColumns="1fr 1fr" gap={4} fontSize="sm">
                  <Box>
                    <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
                      Email
                    </Text>
                    <Link href={`mailto:${selected.email}`} color="river.600">
                      {selected.email}
                    </Link>
                  </Box>
                  <Box>
                    <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
                      Phone
                    </Text>
                    {selected.phone ? (
                      <Link href={`tel:${selected.phone}`} color="river.600">
                        {selected.phone}
                      </Link>
                    ) : (
                      <Text color="ink.300">—</Text>
                    )}
                  </Box>
                  <Box>
                    <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
                      Company
                    </Text>
                    <Text>{selected.company || '—'}</Text>
                  </Box>
                  <Box>
                    <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
                      Lifetime paid
                    </Text>
                    <Mono fontWeight={500}>{orders ? formatMoney(lifetime) : '…'}</Mono>
                  </Box>
                </Grid>

                <FormControl>
                  <FormLabel>Notes</FormLabel>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={3} fontSize="sm" placeholder="Preferred ink colors, PO requirements, how they like to be contacted." />
                  <Text fontSize="xs" color="ink.300" mt={1}>
                    {saving ? 'Saving…' : 'Autosaves when you click away.'}
                  </Text>
                </FormControl>

                <Box>
                  <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600} mb={2}>
                    Order history
                  </Text>
                  {orders === null ? (
                    <Stack spacing={2}>
                      <Skeleton h="36px" />
                      <Skeleton h="36px" />
                    </Stack>
                  ) : orders.length === 0 ? (
                    <Text fontSize="sm" color="ink.500">
                      No orders on record.
                    </Text>
                  ) : (
                    <Table size="sm">
                      <Thead>
                        <Tr>
                          <Th>Order</Th>
                          <Th>Status</Th>
                          <Th isNumeric>Total</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {orders.map((o) => (
                          <Tr key={o.id}>
                            <Td>
                              <Link as={RouterLink} to={`/orders/${o.id}`} _hover={{ color: 'ember.600' }}>
                                <Mono fontWeight={500}>{o.order_number}</Mono>
                              </Link>
                              <Text fontSize="xs" color="ink.500">
                                {formatDate(o.created_at)}
                              </Text>
                            </Td>
                            <Td>
                              <Stack spacing={1}>
                                <OrderStatusBadge status={o.status} />
                                <PaymentStatusBadge status={o.payment_status} />
                              </Stack>
                            </Td>
                            <Td isNumeric>
                              <Mono>{formatMoney(o.total)}</Mono>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  )}
                </Box>
              </Stack>
            ) : (
              <Stack spacing={3}>
                <Skeleton h="60px" />
                <Skeleton h="120px" />
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </MotionFade>
  )
}
