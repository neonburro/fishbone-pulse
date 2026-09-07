import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Grid,
  GridItem,
  Heading,
  HStack,
  Link,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
} from '@chakra-ui/react'
import { FiArrowRight, FiPlus } from 'react-icons/fi'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import Mono from '../components/common/Mono'
import RegMark from '../components/common/RegMark'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import MotionFade from '../components/common/MotionFade'
import { OrderStatusBadge, PaymentStatusBadge } from '../components/common/StatusBadge'
import { getOrderStats, recentOrders } from '../lib/api/orders'
import { countNewQuotes } from '../lib/api/quotes'
import { getRecentActivity } from '../utils/activityLogger'
import { formatMoney } from '../utils/money'
import { formatDate, timeAgo, humanize } from '../utils/format'
import { useAuthStore, displayNameOf } from '../store/authStore'

function StatTile({ label, value, hint, to, accent = 'ink.900', isLoading, isNew }) {
  return (
    <Box
      as={to ? RouterLink : 'div'}
      to={to}
      bg="white"
      borderRadius="base"
      boxShadow="card"
      p={4}
      position="relative"
      overflow="hidden"
      _hover={to ? { boxShadow: '0 0 0 1px #FF6A13, 0 1px 2px rgba(11,11,12,0.06)' } : undefined}
      transition="box-shadow 0.15s"
      display="block"
    >
      <Box position="absolute" left={0} top={0} bottom={0} w="3px" bg={accent} />
      <HStack justify="space-between" align="flex-start">
        <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
          {label}
        </Text>
        {isNew && <Box w="8px" h="8px" borderRadius="full" bg="hivis.400" boxShadow="0 0 0 3px rgba(198,241,53,0.3)" mt={1} />}
      </HStack>
      {isLoading ? (
        <Skeleton h="34px" w="80px" mt={2} />
      ) : (
        <Text fontFamily="heading" fontWeight={800} fontSize="3xl" lineHeight="1" mt={2} color="ink.900">
          {value}
        </Text>
      )}
      {hint && (
        <Text fontSize="xs" color="ink.500" mt={1.5}>
          {hint}
        </Text>
      )}
    </Box>
  )
}

export default function Dashboard() {
  const { user, admin } = useAuthStore()
  const [stats, setStats] = useState(null)
  const [newQuotes, setNewQuotes] = useState(null)
  const [orders, setOrders] = useState(null)
  const [activity, setActivity] = useState(null)
  const [error, setError] = useState('')

  const load = async () => {
    setError('')
    try {
      const [s, q, o, a] = await Promise.all([getOrderStats(), countNewQuotes(), recentOrders(10), getRecentActivity(12)])
      setStats(s)
      setNewQuotes(q)
      setOrders(o)
      setActivity(a)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <MotionFade>
      <PageHeader
        eyebrow={`${greeting}, ${displayNameOf(user, admin)}`}
        title="Dashboard"
        description="What is on the press today, what needs a decision, and what came in overnight."
        actions={
          <>
            <Button as={RouterLink} to="/orders?status=pending_review" variant="outline" size="sm">
              Review queue
            </Button>
            <Button as={RouterLink} to="/products/new" size="sm" leftIcon={<FiPlus />}>
              New product
            </Button>
          </>
        }
      />

      {error && (
        <Box mb={6}>
          <ErrorState message={error} onRetry={load} />
        </Box>
      )}

      <SimpleGrid columns={{ base: 2, md: 3, xl: 5 }} spacing={3} mb={6}>
        <StatTile label="Needs review" value={stats?.needsReview ?? 0} hint="New orders awaiting approval" to="/orders?status=pending_review" accent="ember.500" isLoading={!stats && !error} isNew={stats?.needsReview > 0} />
        <StatTile label="In production" value={stats?.inProduction ?? 0} hint="On press or being decorated" to="/orders?status=in_production" accent="blue.500" isLoading={!stats && !error} />
        <StatTile label="Ready for pickup" value={stats?.ready ?? 0} hint="Boxed and waiting at the counter" to="/orders?status=ready_for_pickup" accent="hivis.500" isLoading={!stats && !error} />
        <StatTile label="New quotes" value={newQuotes ?? 0} hint="Festival and custom requests" to="/quotes?status=new" accent="river.500" isLoading={newQuotes === null && !error} isNew={newQuotes > 0} />
        <StatTile label="Revenue MTD" value={formatMoney(stats?.revenueMTD ?? 0)} hint="Paid orders this month" accent="green.500" isLoading={!stats && !error} />
      </SimpleGrid>

      <Grid templateColumns={{ base: '1fr', xl: '2fr 1fr' }} gap={5}>
        <GridItem minW={0}>
          <Card
            title="Recent orders"
            p={0}
            action={
              <Button as={RouterLink} to="/orders" size="xs" variant="ghost" rightIcon={<FiArrowRight />}>
                All orders
              </Button>
            }
            sx={{ '& > div:first-of-type': { px: 5, pt: 4, mb: 2 } }}
          >
            {orders === null ? (
              <Stack p={4} spacing={2}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} h="40px" />
                ))}
              </Stack>
            ) : orders.length === 0 ? (
              <EmptyState title="No orders yet" description="Orders placed on the storefront show up here the moment they land." py={10} />
            ) : (
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Order</Th>
                      <Th>Customer</Th>
                      <Th>Status</Th>
                      <Th display={{ base: 'none', '2xl': 'table-cell' }}>Payment</Th>
                      <Th isNumeric>Total</Th>
                      <Th>Placed</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {orders.map((o) => (
                      <Tr key={o.id} _hover={{ bg: 'paper2' }}>
                        <Td>
                          <Link as={RouterLink} to={`/orders/${o.id}`} color="ink.900" _hover={{ color: 'ember.600' }}>
                            <Mono fontWeight={500}>{o.order_number}</Mono>
                          </Link>
                        </Td>
                        <Td maxW="220px">
                          <Text noOfLines={1}>{o.contact?.name || '—'}</Text>
                          <Text fontSize="xs" color="ink.500" noOfLines={1}>
                            {o.contact?.email}
                          </Text>
                        </Td>
                        <Td>
                          <OrderStatusBadge status={o.status} />
                        </Td>
                        <Td display={{ base: 'none', '2xl': 'table-cell' }}>
                          <PaymentStatusBadge status={o.payment_status} />
                        </Td>
                        <Td isNumeric>
                          <Mono>{formatMoney(o.total)}</Mono>
                        </Td>
                        <Td whiteSpace="nowrap" color="ink.500">
                          {formatDate(o.created_at, 'MMM d')}
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </Card>
        </GridItem>

        <GridItem minW={0}>
          <VStack align="stretch" spacing={5}>
            <Card title="Quick links">
              <SimpleGrid columns={2} spacing={2}>
                {[
                  { label: 'Awaiting payment', to: '/orders?status=awaiting_payment' },
                  { label: 'Ready to ship', to: '/orders?status=paid' },
                  { label: 'New quote requests', to: '/quotes?status=new' },
                  { label: 'Customers', to: '/customers' },
                  { label: 'Catalog', to: '/products' },
                  { label: 'Announcement bar', to: '/settings?tab=announcement' },
                ].map((l) => (
                  <Button key={l.to} as={RouterLink} to={l.to} size="sm" variant="outline" justifyContent="flex-start" fontSize="xs" whiteSpace="normal" textAlign="left" h="auto" py={2}>
                    {l.label}
                  </Button>
                ))}
              </SimpleGrid>
            </Card>

            <Card title="Recent activity">
              {activity === null ? (
                <Stack spacing={3}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} h="32px" />
                  ))}
                </Stack>
              ) : activity.length === 0 ? (
                <Text fontSize="sm" color="ink.500">
                  Changes made in Pulse — product edits, status updates, settings — appear here.
                </Text>
              ) : (
                <VStack align="stretch" spacing={0} position="relative">
                  {activity.map((a, i) => (
                    <HStack key={a.id} align="flex-start" spacing={3} py={2} borderBottom={i < activity.length - 1 ? '1px dashed' : 'none'} borderColor="bone.200">
                      <Box color="ember.500" mt="3px">
                        <RegMark size={12} />
                      </Box>
                      <Box flex="1" minW={0}>
                        <Text fontSize="sm" noOfLines={2}>
                          <Text as="span" fontWeight={600}>
                            {a.user_name || a.user_email}
                          </Text>{' '}
                          {humanize(a.action).toLowerCase()} {a.entity_type}{' '}
                          {a.entity_name && (
                            <Text as="span" fontWeight={500}>
                              “{a.entity_name}”
                            </Text>
                          )}
                        </Text>
                        <Text fontSize="xs" color="ink.500">
                          {timeAgo(a.created_at)}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Card>
          </VStack>
        </GridItem>
      </Grid>

      <Heading as="h2" size="xs" color="ink.300" mt={10} textAlign="center" letterSpacing="0.14em">
        Fishbone Graphics · Ridgway, Colorado
      </Heading>
    </MotionFade>
  )
}
