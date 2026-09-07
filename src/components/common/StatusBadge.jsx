import { Badge, Box, HStack } from '@chakra-ui/react'
import { humanize } from '../../utils/format'
import { ORDER_STATUS_META, PAYMENT_STATUS_META, QUOTE_STATUS_META } from '../../lib/statusMeta'

export function OrderStatusBadge({ status, ...rest }) {
  const meta = ORDER_STATUS_META[status] || { label: humanize(status), bg: 'bone.200', color: 'ink.700' }
  return (
    <Badge bg={meta.bg} color={meta.color} fontSize="xs" whiteSpace="nowrap" {...rest}>
      <HStack spacing={1.5} display="inline-flex" align="center">
        {meta.dot && <Box w="6px" h="6px" borderRadius="full" bg={meta.dot} />}
        <span>{meta.label}</span>
      </HStack>
    </Badge>
  )
}

export function PaymentStatusBadge({ status, ...rest }) {
  const meta = PAYMENT_STATUS_META[status] || { label: humanize(status), bg: 'bone.200', color: 'ink.700' }
  return (
    <Badge bg={meta.bg} color={meta.color} fontSize="xs" whiteSpace="nowrap" {...rest}>
      {meta.label}
    </Badge>
  )
}

export function QuoteStatusBadge({ status, ...rest }) {
  const meta = QUOTE_STATUS_META[status] || { label: humanize(status), bg: 'bone.200', color: 'ink.700' }
  return (
    <Badge bg={meta.bg} color={meta.color} fontSize="xs" whiteSpace="nowrap" {...rest}>
      <HStack spacing={1.5} display="inline-flex" align="center">
        {meta.dot && <Box w="6px" h="6px" borderRadius="full" bg={meta.dot} />}
        <span>{meta.label}</span>
      </HStack>
    </Badge>
  )
}

export function ActiveBadge({ active }) {
  return active ? (
    <Badge bg="green.100" color="green.800" fontSize="xs">
      Active
    </Badge>
  ) : (
    <Badge bg="bone.200" color="ink.500" fontSize="xs">
      Hidden
    </Badge>
  )
}
