import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  HStack,
  Link,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tab,
  TabList,
  Tabs,
} from '@chakra-ui/react'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import SearchInput from '../../components/common/SearchInput'
import Pagination from '../../components/common/Pagination'
import TableSkeleton from '../../components/common/TableSkeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/StatusBadge'
import { listOrders, ORDER_STATUSES } from '../../lib/api/orders'
import { formatMoney } from '../../utils/money'
import { formatDate } from '../../utils/format'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending_review', label: 'Needs review' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'awaiting_payment', label: 'Awaiting payment' },
  { key: 'paid', label: 'Paid' },
  { key: 'in_production', label: 'In production' },
  { key: 'ready_for_pickup', label: 'Ready' },
  { key: 'shipped', label: 'Shipped' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
]

export default function Orders() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const status = params.get('status') || 'all'
  const page = parseInt(params.get('page') || '1', 10)
  const [search, setSearch] = useState(params.get('q') || '')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const setParam = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '' || v === 'all' || v === 1) next.delete(k)
      else next.set(k, String(v))
    })
    setParams(next, { replace: true })
  }

  // debounce search into URL
  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') || '') !== search) setParam({ q: search, page: 1 })
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    listOrders({ status: ORDER_STATUSES.includes(status) ? status : undefined, search: params.get('q') || '', page })
      .then((r) => !cancelled && setResult(r))
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [status, page, params])

  const tabIndex = Math.max(0, TABS.findIndex((t) => t.key === status))

  return (
    <MotionFade>
      <PageHeader
        eyebrow="On the press"
        title="Runs"
        description="Every run that came through the site. Open one to see the job, the art and the money."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Order # or customer email" />}
      />

      <Tabs index={tabIndex} onChange={(i) => setParam({ status: TABS[i].key, page: 1 })} variant="line" size="sm" mb={4} overflowX="auto">
        <TabList minW="max-content">
          {TABS.map((t) => (
            <Tab key={t.key} fontSize="xs" px={3}>
              {t.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      <Card p={0}>
        {error ? (
          <Box p={4}>
            <ErrorState message={error} onRetry={() => setParam({ page })} />
          </Box>
        ) : loading && !result ? (
          <TableSkeleton rows={8} />
        ) : result?.rows.length === 0 ? (
          <EmptyState
            title={search ? 'No matching orders' : 'No orders in this view'}
            description={search ? `Nothing matched “${search}”. Try the full order number (FB-26-01001) or the customer's email.` : 'When a customer places an order on the storefront it lands here first as “Needs review”.'}
          />
        ) : (
          <Box overflowX="auto" opacity={loading ? 0.6 : 1} transition="opacity 0.2s">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Order</Th>
                  <Th>Customer</Th>
                  <Th isNumeric>Items</Th>
                  <Th isNumeric>Total</Th>
                  <Th>Status</Th>
                  <Th>Payment</Th>
                  <Th>Needed by</Th>
                  <Th>Placed</Th>
                </Tr>
              </Thead>
              <Tbody>
                {result.rows.map((o) => {
                  const itemCount = o.order_items?.[0]?.count ?? 0
                  return (
                    <Tr
                      key={o.id}
                      cursor="pointer"
                      _hover={{ bg: 'paper2' }}
                      onClick={() => navigate(`/orders/${o.id}`)}
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && navigate(`/orders/${o.id}`)}
                    >
                      <Td>
                        <Link as={RouterLink} to={`/orders/${o.id}`} onClick={(e) => e.stopPropagation()} _hover={{ color: 'ember.600' }}>
                          <Mono fontWeight={500}>{o.order_number}</Mono>
                        </Link>
                        <Text fontSize="xs" color="ink.500" textTransform="capitalize">
                          {o.fulfillment}
                        </Text>
                      </Td>
                      <Td maxW="240px">
                        <Text noOfLines={1} fontWeight={500}>
                          {o.contact?.name || '—'}
                        </Text>
                        <Text fontSize="xs" color="ink.500" noOfLines={1}>
                          {o.contact?.company ? `${o.contact.company} · ` : ''}
                          {o.contact?.email}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Mono>{itemCount}</Mono>
                      </Td>
                      <Td isNumeric>
                        <Mono fontWeight={500}>{formatMoney(o.total)}</Mono>
                      </Td>
                      <Td>
                        <OrderStatusBadge status={o.status} />
                      </Td>
                      <Td>
                        <PaymentStatusBadge status={o.payment_status} />
                      </Td>
                      <Td whiteSpace="nowrap" color={o.needed_by ? 'ink.900' : 'ink.300'}>
                        {o.needed_by ? formatDate(o.needed_by) : '—'}
                      </Td>
                      <Td whiteSpace="nowrap" color="ink.500">
                        {formatDate(o.created_at, 'MMM d')}
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>

      {result && <Pagination page={result.page} pageSize={result.pageSize} count={result.count} onChange={(p) => setParam({ page: p })} />}

      <HStack mt={6} justify="center" display={{ base: 'flex', md: 'none' }}>
        <Button as={RouterLink} to="/" size="sm" variant="ghost">
          Back to dashboard
        </Button>
      </HStack>
    </MotionFade>
  )
}
