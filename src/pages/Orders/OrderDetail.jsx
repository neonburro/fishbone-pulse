import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Divider,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  Link,
  Select,
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
  VStack,
  Wrap,
  WrapItem,
  Tag,
} from '@chakra-ui/react'
import { FiArrowLeft, FiPrinter, FiMail, FiPhone, FiMapPin, FiPackage, FiSend } from 'react-icons/fi'
import Card from '../../components/common/Card'
import Mono from '../../components/common/Mono'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import RegMark from '../../components/common/RegMark'
import PulledRule from '../../components/common/PulledRule'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/common/StatusBadge'
import { ORDER_STATUS_META, PAYMENT_STATUS_META } from '../../lib/statusMeta'
import ArtworkList from '../../components/orders/ArtworkList'
import SizeChips from '../../components/orders/SizeChips'
import {
  addOrderEvent,
  getOrder,
  ORDER_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  updateInternalNotes,
  updateOrderStatus,
  updatePaymentDetails,
  updatePaymentStatus,
} from '../../lib/api/orders'
import { formatMoney } from '../../utils/money'
import { formatDate, formatDateTime, humanize, pluralize } from '../../utils/format'

const STEPPER = ['pending_review', 'quoted', 'awaiting_payment', 'paid', 'in_production', 'ready_for_pickup', 'completed']

function StatusStepper({ status, fulfillment }) {
  const steps = STEPPER.map((s) => (s === 'ready_for_pickup' && fulfillment === 'ship' ? 'shipped' : s))
  const idx = steps.indexOf(status)
  const cancelled = status === 'cancelled'
  return (
    <HStack spacing={0} align="flex-start" overflowX="auto" py={2}>
      {steps.map((s, i) => {
        const done = idx >= i && !cancelled
        const current = idx === i && !cancelled
        return (
          <HStack key={s} spacing={0} flex="1" minW="86px" align="flex-start">
            <VStack spacing={1} flex="1" position="relative">
              <Box w="14px" h="14px" borderRadius="full" bg={done ? 'ember.500' : 'white'} border="2px solid" borderColor={done ? 'ember.500' : 'bone.300'} boxShadow={current ? '0 0 0 4px rgba(255,106,19,0.2)' : 'none'} zIndex={1} />
              <Text fontSize="10px" fontFamily="heading" textTransform="uppercase" letterSpacing="0.06em" color={done ? 'ink.900' : 'ink.300'} textAlign="center" fontWeight={current ? 700 : 600} whiteSpace="nowrap">
                {ORDER_STATUS_META[s]?.label || humanize(s)}
              </Text>
              {i < steps.length - 1 && <Box position="absolute" top="6px" left="50%" w="100%" h="2px" bg={idx > i && !cancelled ? 'ember.500' : 'bone.200'} />}
            </VStack>
          </HStack>
        )
      })}
    </HStack>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const toast = useToast()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState('')
  const [notes, setNotes] = useState('')
  const [payment, setPayment] = useState({ payment_provider: '', payment_reference: '' })
  const [newNote, setNewNote] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      const o = await getOrder(id)
      if (!o) {
        setError('This order does not exist or you do not have access to it.')
        return
      }
      setOrder(o)
      setNotes(o.internal_notes || '')
      setPayment({ payment_provider: o.payment_provider || '', payment_reference: o.payment_reference || '' })
    } catch (err) {
      setError(err.message)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const fail = (title, err) => toast({ title, description: err.message, status: 'error' })

  const changeStatus = async (status) => {
    if (!order || status === order.status) return
    setSaving('status')
    try {
      await updateOrderStatus(order.id, status, { orderNumber: order.order_number, previous: order.status })
      toast({ title: `Status set to ${ORDER_STATUS_META[status]?.label || humanize(status)}`, status: 'success', duration: 2000 })
      await load()
    } catch (err) {
      fail('Could not update status', err)
    } finally {
      setSaving('')
    }
  }

  const changePaymentStatus = async (ps) => {
    if (!order || ps === order.payment_status) return
    setSaving('payment')
    try {
      await updatePaymentStatus(order.id, ps, { orderNumber: order.order_number, previous: order.payment_status })
      toast({ title: `Payment marked ${PAYMENT_STATUS_META[ps]?.label || humanize(ps)}`, status: 'success', duration: 2000 })
      await load()
    } catch (err) {
      fail('Could not update payment status', err)
    } finally {
      setSaving('')
    }
  }

  const savePaymentDetails = async () => {
    if (!order) return
    if (payment.payment_provider === (order.payment_provider || '') && payment.payment_reference === (order.payment_reference || '')) return
    setSaving('paydetails')
    try {
      await updatePaymentDetails(order.id, payment)
      setOrder((o) => ({ ...o, ...payment }))
      toast({ title: 'Payment details saved', status: 'success', duration: 1500 })
    } catch (err) {
      fail('Could not save payment details', err)
    } finally {
      setSaving('')
    }
  }

  const saveNotes = async () => {
    if (!order || notes === (order.internal_notes || '')) return
    setSaving('notes')
    try {
      await updateInternalNotes(order.id, notes)
      setOrder((o) => ({ ...o, internal_notes: notes }))
      toast({ title: 'Internal notes saved', status: 'success', duration: 1500 })
    } catch (err) {
      fail('Could not save notes', err)
    } finally {
      setSaving('')
    }
  }

  const postNote = async () => {
    const msg = newNote.trim()
    if (!msg) return
    setSaving('event')
    try {
      const ev = await addOrderEvent(order.id, msg)
      setOrder((o) => ({ ...o, events: [ev, ...o.events] }))
      setNewNote('')
    } catch (err) {
      fail('Could not add note', err)
    } finally {
      setSaving('')
    }
  }

  if (error) {
    return (
      <Box>
        <Button as={RouterLink} to="/orders" variant="ghost" size="sm" leftIcon={<FiArrowLeft />} mb={4}>
          Orders
        </Button>
        <ErrorState title="Could not load order" message={error} onRetry={load} />
      </Box>
    )
  }

  if (!order) {
    return (
      <Stack spacing={4}>
        <Skeleton h="28px" w="160px" />
        <Skeleton h="80px" />
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={5}>
          <Skeleton h="360px" />
          <Skeleton h="360px" />
        </Grid>
      </Stack>
    )
  }

  const contact = order.contact || {}
  const addr = order.shipping_address || {}
  const itemCount = order.items.reduce((acc, it) => acc + (it.quantity || 0), 0)

  return (
    <MotionFade>
      <HStack justify="space-between" mb={4} flexWrap="wrap" gap={2}>
        <Button as={RouterLink} to="/orders" variant="ghost" size="sm" leftIcon={<FiArrowLeft />}>
          Orders
        </Button>
        <HStack>
          <Button as={RouterLink} to={`/orders/${order.id}/ticket`} target="_blank" size="sm" variant="outline" leftIcon={<FiPrinter />}>
            Print job ticket
          </Button>
        </HStack>
      </HStack>

      {/* Header */}
      <Card mb={5}>
        <Grid templateColumns={{ base: '1fr', md: '1fr auto' }} gap={4} alignItems="start">
          <Box>
            <HStack spacing={3} align="center" flexWrap="wrap">
              <HStack spacing={2} color="ember.500">
                <RegMark size={16} />
                <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" fontWeight={600}>
                  Job ticket
                </Text>
              </HStack>
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.payment_status} />
            </HStack>
            <Text fontFamily="mono" fontSize={{ base: '2xl', md: '3xl' }} fontWeight={500} mt={1} lineHeight="1.1">
              {order.order_number}
            </Text>
            <PulledRule mt={2} />
            <Text fontSize="sm" color="ink.500" mt={2}>
              Placed {formatDateTime(order.created_at)}
              {order.source ? ` · via ${order.source}` : ''} · {pluralize(order.items.length, 'line')} · {pluralize(itemCount, 'piece')}
            </Text>
            {order.needed_by && (
              <Text fontSize="sm" mt={1}>
                <Text as="span" fontFamily="heading" textTransform="uppercase" letterSpacing="0.08em" fontSize="xs" color="ink.500" mr={2}>
                  Needed by
                </Text>
                <Text as="span" fontWeight={600}>
                  {formatDate(order.needed_by, 'EEEE, MMM d, yyyy')}
                </Text>
              </Text>
            )}
          </Box>

          <Stack spacing={3} minW={{ md: '260px' }}>
            <FormControl>
              <FormLabel>Order status</FormLabel>
              <Select value={order.status} onChange={(e) => changeStatus(e.target.value)} isDisabled={saving === 'status'} size="sm">
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_META[s]?.label || humanize(s)}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Payment status</FormLabel>
              <Select value={order.payment_status} onChange={(e) => changePaymentStatus(e.target.value)} isDisabled={saving === 'payment'} size="sm">
                {PAYMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PAYMENT_STATUS_META[s]?.label || humanize(s)}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Grid>
        <Box mt={4} borderTop="1px dashed" borderColor="bone.200" pt={2}>
          <StatusStepper status={order.status} fulfillment={order.fulfillment} />
        </Box>
      </Card>

      <Grid templateColumns={{ base: '1fr', lg: 'minmax(0, 2fr) minmax(280px, 1fr)' }} gap={5}>
        <GridItem minW={0}>
          <VStack align="stretch" spacing={5}>
            {/* Items */}
            <Card title="Items" p={0} sx={{ '& > div:first-of-type': { px: 5, pt: 4, mb: 2 } }}>
              <Box overflowX="auto">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Product</Th>
                      <Th>Decoration</Th>
                      <Th>Sizes</Th>
                      <Th isNumeric>Qty</Th>
                      <Th isNumeric>Unit</Th>
                      <Th isNumeric>Line</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {order.items.map((it) => (
                      <Tr key={it.id} verticalAlign="top">
                        <Td minW="220px">
                          <HStack align="flex-start" spacing={3}>
                            <Box w="18px" h="18px" mt="2px" borderRadius="sm" border="1px solid" borderColor="bone.300" bg={it.variant_color_hex || it.color_hex || 'bone.100'} flexShrink={0} title={it.variant_label || ''} />
                            <Box>
                              <Text fontWeight={600}>{it.product_name}</Text>
                              <Text fontSize="xs" color="ink.500">
                                {it.variant_label || 'No color'}
                                {it.sku && (
                                  <>
                                    {' · '}
                                    <Mono fontSize="xs">{it.sku}</Mono>
                                  </>
                                )}
                              </Text>
                              {it.notes && (
                                <Text fontSize="xs" color="ink.700" mt={1} fontStyle="italic">
                                  “{it.notes}”
                                </Text>
                              )}
                              <Box mt={2}>
                                <ArtworkList files={it.artwork_files} compact />
                              </Box>
                            </Box>
                          </HStack>
                        </Td>
                        <Td minW="160px">
                          <Text fontSize="sm">{humanize(it.decoration_method) || '—'}</Text>
                          {Array.isArray(it.print_locations) && it.print_locations.length > 0 && (
                            <Wrap mt={1} spacing={1}>
                              {it.print_locations.map((loc, i) => (
                                <WrapItem key={i}>
                                  <Tag size="sm" borderRadius="sm" bg="paper2" fontSize="xs">
                                    {typeof loc === 'string' ? humanize(loc) : loc?.name || loc?.location || humanize(loc?.key) || 'Location'}
                                    {typeof loc === 'object' && loc?.colors ? ` · ${loc.colors} color` : ''}
                                  </Tag>
                                </WrapItem>
                              ))}
                            </Wrap>
                          )}
                        </Td>
                        <Td minW="180px">
                          <SizeChips breakdown={it.size_breakdown} quantity={it.quantity} />
                        </Td>
                        <Td isNumeric>
                          <Mono>{it.quantity}</Mono>
                        </Td>
                        <Td isNumeric>
                          <Mono>{formatMoney(it.unit_price)}</Mono>
                        </Td>
                        <Td isNumeric>
                          <Mono fontWeight={500}>{formatMoney(it.line_total)}</Mono>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
              <Box px={5} py={4} borderTop="1px solid" borderColor="bone.200">
                <Grid templateColumns={{ base: '1fr', md: '1fr 260px' }} gap={4}>
                  <Box>
                    {order.customer_notes && (
                      <>
                        <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
                          Customer notes
                        </Text>
                        <Text fontSize="sm" mt={1} whiteSpace="pre-wrap">
                          {order.customer_notes}
                        </Text>
                      </>
                    )}
                  </Box>
                  <VStack align="stretch" spacing={1} fontSize="sm">
                    {[
                      ['Subtotal', order.subtotal],
                      ['Setup fees', order.setup_fees],
                      ['Discount', order.discount ? -Math.abs(order.discount) : 0],
                      ['Shipping', order.shipping],
                      ['Tax', order.tax],
                    ].map(([label, val]) => (
                      <HStack key={label} justify="space-between" color="ink.700">
                        <Text>{label}</Text>
                        <Mono>{formatMoney(val, { dash: false })}</Mono>
                      </HStack>
                    ))}
                    <Divider borderColor="ink.900" />
                    <HStack justify="space-between" fontWeight={700}>
                      <Text fontFamily="heading" textTransform="uppercase" letterSpacing="0.06em">
                        Total
                      </Text>
                      <Mono fontSize="lg" fontWeight={500}>
                        {formatMoney(order.total)}
                      </Mono>
                    </HStack>
                  </VStack>
                </Grid>
              </Box>
            </Card>

            {/* Internal notes */}
            <Card title="Internal notes" action={saving === 'notes' ? <Text fontSize="xs" color="ink.500">Saving…</Text> : <Text fontSize="xs" color="ink.300">Autosaves when you click away</Text>}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={4} placeholder="Screen counts, ink mixes, who called, anything the crew should know. Customers never see this." fontSize="sm" />
            </Card>

            {/* Timeline */}
            <Card title="Timeline">
              <HStack mb={4} align="flex-start">
                <Input value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note to the timeline" size="sm" onKeyDown={(e) => e.key === 'Enter' && postNote()} />
                <Button size="sm" onClick={postNote} isLoading={saving === 'event'} leftIcon={<FiSend />} variant="outline">
                  Post
                </Button>
              </HStack>
              {order.events.length === 0 ? (
                <Text fontSize="sm" color="ink.500">
                  No events yet. Status changes are recorded here automatically.
                </Text>
              ) : (
                <VStack align="stretch" spacing={0} pl={2}>
                  {order.events.map((ev, i) => (
                    <HStack key={ev.id} align="flex-start" spacing={3} position="relative" pb={i < order.events.length - 1 ? 4 : 0}>
                      {i < order.events.length - 1 && <Box position="absolute" left="5px" top="14px" bottom={0} w="2px" bg="bone.200" />}
                      <Box w="12px" h="12px" mt="4px" borderRadius="full" bg={ev.type === 'status_changed' || ev.type === 'status' ? 'ember.500' : 'river.500'} flexShrink={0} zIndex={1} />
                      <Box flex="1" minW={0}>
                        <Text fontSize="sm">{ev.message || humanize(ev.type)}</Text>
                        <Text fontSize="xs" color="ink.500">
                          {ev.actor_label || 'System'} · {formatDateTime(ev.created_at)}
                          {ev.type ? ` · ${humanize(ev.type)}` : ''}
                        </Text>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              )}
            </Card>
          </VStack>
        </GridItem>

        <GridItem minW={0}>
          <VStack align="stretch" spacing={5}>
            {/* Customer */}
            <Card title="Customer" action={order.customer?.id && <Link as={RouterLink} to={`/customers?open=${order.customer.id}`} fontSize="xs" color="river.600">View history</Link>}>
              <Text fontWeight={600}>{contact.name || order.customer?.name || '—'}</Text>
              {(contact.company || order.customer?.company) && (
                <Text fontSize="sm" color="ink.500">
                  {contact.company || order.customer?.company}
                </Text>
              )}
              <VStack align="stretch" spacing={1.5} mt={3} fontSize="sm">
                {(contact.email || order.customer?.email) && (
                  <HStack>
                    <Box as={FiMail} color="ink.300" />
                    <Link href={`mailto:${contact.email || order.customer?.email}`} color="river.600">
                      {contact.email || order.customer?.email}
                    </Link>
                  </HStack>
                )}
                {(contact.phone || order.customer?.phone) && (
                  <HStack>
                    <Box as={FiPhone} color="ink.300" />
                    <Link href={`tel:${contact.phone || order.customer?.phone}`} color="river.600">
                      {contact.phone || order.customer?.phone}
                    </Link>
                  </HStack>
                )}
              </VStack>
              {order.customer?.notes && (
                <Text fontSize="xs" color="ink.500" mt={3} borderTop="1px dashed" borderColor="bone.200" pt={2}>
                  {order.customer.notes}
                </Text>
              )}
            </Card>

            {/* Fulfillment */}
            <Card title="Fulfillment">
              <HStack spacing={2} mb={2}>
                <Box as={order.fulfillment === 'ship' ? FiPackage : FiMapPin} color="ember.500" />
                <Text fontWeight={600} textTransform="capitalize">
                  {order.fulfillment === 'ship' ? 'Ship to customer' : 'Pickup at the shop'}
                </Text>
              </HStack>
              {order.fulfillment === 'ship' ? (
                <Box fontSize="sm" color="ink.700" lineHeight="1.4">
                  {addr.name && <Text>{addr.name}</Text>}
                  {addr.line1 && <Text>{addr.line1}</Text>}
                  {addr.line2 && <Text>{addr.line2}</Text>}
                  {(addr.city || addr.state || addr.zip || addr.postal_code) && (
                    <Text>
                      {[addr.city, addr.state].filter(Boolean).join(', ')} {addr.zip || addr.postal_code}
                    </Text>
                  )}
                  {addr.country && <Text>{addr.country}</Text>}
                  {!addr.line1 && !addr.city && (
                    <Text color="ink.300">No shipping address on file.</Text>
                  )}
                </Box>
              ) : (
                <Text fontSize="sm" color="ink.500">
                  Customer will pick up in Ridgway. Mark “Ready for pickup” when it is boxed.
                </Text>
              )}
            </Card>

            {/* Payment */}
            <Card title="Payment">
              <Stack spacing={3}>
                <FormControl>
                  <FormLabel>Provider</FormLabel>
                  <Select size="sm" value={payment.payment_provider} onChange={(e) => setPayment((p) => ({ ...p, payment_provider: e.target.value }))} onBlur={savePaymentDetails}>
                    <option value="">Not set</option>
                    {PAYMENT_PROVIDERS.map((p) => (
                      <option key={p} value={p}>
                        {humanize(p)}
                      </option>
                    ))}
                  </Select>
                </FormControl>
                <FormControl>
                  <FormLabel>Reference</FormLabel>
                  <Input size="sm" fontFamily="mono" value={payment.payment_reference} onChange={(e) => setPayment((p) => ({ ...p, payment_reference: e.target.value }))} onBlur={savePaymentDetails} placeholder="Invoice #, Stripe charge, check #" />
                </FormControl>
                {saving === 'paydetails' && (
                  <Text fontSize="xs" color="ink.500">
                    Saving…
                  </Text>
                )}
              </Stack>
            </Card>
          </VStack>
        </GridItem>
      </Grid>
    </MotionFade>
  )
}
