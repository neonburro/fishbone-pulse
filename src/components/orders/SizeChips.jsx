import { HStack, Tag, Text } from '@chakra-ui/react'
import { sizeBreakdownTotal, sortedSizes } from '../../utils/format'

export default function SizeChips({ breakdown, quantity }) {
  const entries = sortedSizes(breakdown)
  const total = sizeBreakdownTotal(breakdown)
  if (!entries.length) {
    return (
      <Text fontSize="xs" color="ink.300">
        No size breakdown
      </Text>
    )
  }
  const mismatch = quantity !== undefined && quantity !== null && total !== Number(quantity)
  return (
    <HStack spacing={1} flexWrap="wrap" rowGap={1}>
      {entries.map(([size, qty]) => (
        <Tag key={size} size="sm" borderRadius="sm" bg="white" border="1px solid" borderColor="bone.300" fontFamily="mono" fontSize="xs">
          {size.toUpperCase()}
          <Text as="span" color="ink.500" ml={1}>
            ×{qty}
          </Text>
        </Tag>
      ))}
      {mismatch && (
        <Tag size="sm" borderRadius="sm" bg="red.100" color="red.800" fontSize="xs">
          Sizes total {total}, qty {quantity}
        </Tag>
      )}
    </HStack>
  )
}
