import { Button, HStack, Text } from '@chakra-ui/react'

export default function Pagination({ page, pageSize, count, onChange }) {
  const pages = Math.max(1, Math.ceil(count / pageSize))
  if (count <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(count, page * pageSize)
  return (
    <HStack justify="space-between" mt={4} flexWrap="wrap" gap={2}>
      <Text fontSize="sm" color="ink.500" fontFamily="mono">
        {from}–{to} of {count}
      </Text>
      <HStack>
        <Button size="sm" variant="outline" onClick={() => onChange(page - 1)} isDisabled={page <= 1}>
          Previous
        </Button>
        <Text fontSize="sm" fontFamily="mono" px={2}>
          {page} / {pages}
        </Text>
        <Button size="sm" variant="outline" onClick={() => onChange(page + 1)} isDisabled={page >= pages}>
          Next
        </Button>
      </HStack>
    </HStack>
  )
}
