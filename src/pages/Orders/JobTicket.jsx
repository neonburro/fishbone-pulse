import { useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Box, Button, Grid, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, VStack } from '@chakra-ui/react'
import { FiArrowLeft, FiPrinter } from 'react-icons/fi'
import { FishboneMark } from '../../components/brand/Logo'
import RegMark from '../../components/common/RegMark'
import { getOrder } from '../../lib/api/orders'
import { formatMoney } from '../../utils/money'
import { formatDate, formatDateTime, humanize, sortedSizes } from '../../utils/format'
import { ORDER_STATUS_META } from '../../lib/statusMeta'

/**
 * Print-friendly job ticket. Minimal chrome; the toolbar hides under @media print.
 */
export default function JobTicket() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getOrder(id)
      .then((o) => (o ? setOrder(o) : setError('Order not found')))
      .catch((err) => setError(err.message))
  }, [id])

  useEffect(() => {
    if (order) document.title = `Job ticket ${order.order_number} — Fishbone Pulse`
    return () => {
      document.title = 'Fishbone Pulse'
    }
  }, [order])

  if (error) {
    return (
      <Box p={8}>
        <Text color="red.600">{error}</Text>
        <Button as={RouterLink} to="/orders" mt={4} size="sm" variant="outline">
          Back to orders
        </Button>
      </Box>
    )
  }
  if (!order) {
    return (
      <Box p={8} fontFamily="mono" fontSize="sm" color="ink.500">
        Loading ticket…
      </Box>
    )
  }

  const contact = order.contact || {}
  const addr = order.shipping_address || {}
  const totalPieces = order.items.reduce((a, it) => a + (it.quantity || 0), 0)

  return (
    <Box bg="white" minH="100vh" color="ink.900" fontSize="sm">
      <HStack className="no-print" px={6} py={3} bg="paper" borderBottom="1px solid" borderColor="bone.200" justify="space-between">
        <Button as={RouterLink} to={`/orders/${order.id}`} size="sm" variant="ghost" leftIcon={<FiArrowLeft />}>
          Back to order
        </Button>
        <Button size="sm" leftIcon={<FiPrinter />} onClick={() => window.print()}>
          Print
        </Button>
      </HStack>

      <Box className="ticket-page" maxW="800px" mx="auto" px={{ base: 5, md: 8 }} py={8}>
        {/* Header */}
        <HStack justify="space-between" align="flex-start" borderBottom="3px solid" borderColor="ink.900" pb={4}>
          <HStack spacing={3}>
            <FishboneMark size={44} tone="dark" />
            <Box lineHeight="1">
              <Text fontFamily="heading" fontWeight={800} fontSize="2xl" textTransform="uppercase" letterSpacing="-0.01em">
                Fishbone Graphics
              </Text>
              <Text fontFamily="heading" fontSize="xs" letterSpacing="0.18em" textTransform="uppercase" color="ink.500" mt={1}>
                Screen Printing · Ridgway, CO · (970) 626-4437
              </Text>
            </Box>
          </HStack>
          <Box textAlign="right">
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.14em" textTransform="uppercase" color="ink.500">
              Job ticket
            </Text>
            <Text fontFamily="mono" fontSize="2xl" fontWeight={500} lineHeight="1.1">
              {order.order_number}
            </Text>
            <Text fontSize="xs" color="ink.500" mt={1}>
              {ORDER_STATUS_META[order.status]?.label || humanize(order.status)} · {humanize(order.payment_status)}
            </Text>
          </Box>
        </HStack>

        {/* Meta grid */}
        <Grid templateColumns="repeat(3, 1fr)" gap={4} mt={5} borderBottom="1px solid" borderColor="bone.300" pb={5}>
          <Box>
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={1}>
              Customer
            </Text>
            <Text fontWeight={600}>{contact.name || order.customer?.name || '—'}</Text>
            {contact.company && <Text>{contact.company}</Text>}
            <Text>{contact.email || order.customer?.email}</Text>
            <Text>{contact.phone || order.customer?.phone}</Text>
          </Box>
          <Box>
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={1}>
              {order.fulfillment === 'ship' ? 'Ship to' : 'Fulfillment'}
            </Text>
            {order.fulfillment === 'ship' ? (
              <Box>
                {addr.name && <Text>{addr.name}</Text>}
                {addr.line1 && <Text>{addr.line1}</Text>}
                {addr.line2 && <Text>{addr.line2}</Text>}
                <Text>
                  {[addr.city, addr.state].filter(Boolean).join(', ')} {addr.zip || addr.postal_code}
                </Text>
              </Box>
            ) : (
              <Text fontWeight={600}>Pickup at shop</Text>
            )}
          </Box>
          <Box>
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={1}>
              Dates
            </Text>
            <Text>Placed: {formatDateTime(order.created_at)}</Text>
            <Text fontWeight={700}>Needed by: {order.needed_by ? formatDate(order.needed_by, 'EEE MMM d, yyyy') : 'Not specified'}</Text>
            <Text>
              {order.items.length} line{order.items.length === 1 ? '' : 's'} · {totalPieces} pieces
            </Text>
          </Box>
        </Grid>

        {/* Items */}
        {order.items.map((it, idx) => {
          const sizes = sortedSizes(it.size_breakdown)
          return (
            <Box key={it.id} mt={5} border="1px solid" borderColor="ink.900" borderRadius="sm" overflow="hidden" sx={{ breakInside: 'avoid' }}>
              <HStack bg="ink.900" color="bone.500" px={3} py={1.5} justify="space-between">
                <HStack spacing={2}>
                  <RegMark size={12} color="#FF6A13" />
                  <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase">
                    Line {idx + 1}
                  </Text>
                </HStack>
                <Text fontFamily="mono" fontSize="xs">
                  {it.sku || ''}
                </Text>
              </HStack>
              <Grid templateColumns={{ base: '1fr', md: '1.4fr 1fr' }} gap={4} p={3}>
                <Box>
                  <Text fontWeight={700} fontSize="md">
                    {it.product_name}
                  </Text>
                  <HStack spacing={2} mt={1}>
                    {it.variant_label && (
                      <>
                        <Box w="14px" h="14px" border="1px solid" borderColor="ink.900" bg={it.color_hex || 'transparent'} borderRadius="sm" sx={{ WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }} />
                        <Text>{it.variant_label}</Text>
                      </>
                    )}
                  </HStack>
                  <Text mt={2}>
                    <Text as="span" color="ink.500">
                      Decoration:
                    </Text>{' '}
                    <Text as="span" fontWeight={600}>
                      {humanize(it.decoration_method) || '—'}
                    </Text>
                  </Text>
                  {Array.isArray(it.print_locations) && it.print_locations.length > 0 && (
                    <Text>
                      <Text as="span" color="ink.500">
                        Locations:
                      </Text>{' '}
                      {it.print_locations
                        .map((loc) => (typeof loc === 'string' ? humanize(loc) : `${loc?.name || loc?.location || humanize(loc?.key)}${loc?.colors ? ` (${loc.colors} color)` : ''}`))
                        .join(', ')}
                    </Text>
                  )}
                  {it.notes && (
                    <Text mt={2} fontStyle="italic">
                      “{it.notes}”
                    </Text>
                  )}
                  {Array.isArray(it.artwork_files) && it.artwork_files.length > 0 && (
                    <Box mt={2}>
                      <Text color="ink.500">Artwork files:</Text>
                      {it.artwork_files.map((f) => (
                        <Text key={f.path} fontFamily="mono" fontSize="xs">
                          {f.name || f.path.split('/').pop()}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
                <Box>
                  <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={1}>
                    Size breakdown · {it.quantity} pcs
                  </Text>
                  {sizes.length ? (
                    <Table size="sm" variant="unstyled" sx={{ td: { border: '1px solid', borderColor: 'ink.900', px: 2, py: 1, textAlign: 'center', fontFamily: 'mono' } }}>
                      <Tbody>
                        <Tr>
                          {sizes.map(([s]) => (
                            <Td key={s} fontWeight={700} bg="paper2">
                              {s.toUpperCase()}
                            </Td>
                          ))}
                        </Tr>
                        <Tr>
                          {sizes.map(([s, q]) => (
                            <Td key={s}>{q}</Td>
                          ))}
                        </Tr>
                      </Tbody>
                    </Table>
                  ) : (
                    <Text color="ink.500">No sizes (one size / not apparel)</Text>
                  )}
                  <Text mt={2} fontFamily="mono" fontSize="xs" color="ink.500">
                    {formatMoney(it.unit_price)} × {it.quantity} = {formatMoney(it.line_total)}
                  </Text>
                </Box>
              </Grid>
            </Box>
          )
        })}

        {/* Notes + totals */}
        <Grid templateColumns={{ base: '1fr', md: '1fr 220px' }} gap={6} mt={6}>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={1}>
                Customer notes
              </Text>
              <Text whiteSpace="pre-wrap">{order.customer_notes || '—'}</Text>
            </Box>
            <Box>
              <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={1}>
                Shop notes (internal)
              </Text>
              <Text whiteSpace="pre-wrap">{order.internal_notes || '—'}</Text>
            </Box>
            <Box>
              <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" mb={2}>
                Production checklist
              </Text>
              <Grid templateColumns="repeat(2, 1fr)" gap={1}>
                {['Art approved', 'Screens burned', 'Garments received', 'Garments counted', 'Printed', 'Cured / QC', 'Folded & boxed', 'Customer notified'].map((s) => (
                  <HStack key={s} spacing={2}>
                    <Box w="12px" h="12px" border="1.5px solid" borderColor="ink.900" borderRadius="2px" />
                    <Text fontSize="xs">{s}</Text>
                  </HStack>
                ))}
              </Grid>
            </Box>
          </VStack>
          <Box>
            <Table size="sm" variant="unstyled" sx={{ td: { px: 0, py: 0.5 } }}>
              <Thead>
                <Tr>
                  <Th px={0} pb={1} borderBottom="1px solid" borderColor="ink.900" colSpan={2} fontFamily="heading" fontSize="xs" letterSpacing="0.12em" color="ink.500" bg="transparent">
                    Totals
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {[
                  ['Subtotal', order.subtotal],
                  ['Setup', order.setup_fees],
                  ['Discount', order.discount ? -Math.abs(order.discount) : 0],
                  ['Shipping', order.shipping],
                  ['Tax', order.tax],
                ].map(([l, v]) => (
                  <Tr key={l}>
                    <Td color="ink.500">{l}</Td>
                    <Td isNumeric fontFamily="mono">
                      {formatMoney(v, { dash: false })}
                    </Td>
                  </Tr>
                ))}
                <Tr>
                  <Td fontWeight={700} borderTop="2px solid" borderColor="ink.900" pt={1} fontFamily="heading" textTransform="uppercase">
                    Total
                  </Td>
                  <Td isNumeric fontFamily="mono" fontWeight={500} fontSize="md" borderTop="2px solid" borderColor="ink.900" pt={1}>
                    {formatMoney(order.total)}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </Box>
        </Grid>

        <HStack mt={10} justify="space-between" fontSize="xs" color="ink.500" borderTop="1px dashed" borderColor="bone.300" pt={3}>
          <Text fontFamily="mono">{order.order_number}</Text>
          <Text>Printed {formatDateTime(new Date())}</Text>
        </HStack>
      </Box>
    </Box>
  )
}
