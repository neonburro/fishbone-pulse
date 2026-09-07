import { Skeleton, Stack } from '@chakra-ui/react'

export default function TableSkeleton({ rows = 6, height = '40px' }) {
  return (
    <Stack spacing={2} p={2}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={height} />
      ))}
    </Stack>
  )
}
