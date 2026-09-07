import { Box, Heading, Text, VStack } from '@chakra-ui/react'
import RegMark from './RegMark'

export default function EmptyState({ title = 'Nothing here yet', description, action, py = 14 }) {
  return (
    <VStack py={py} px={6} spacing={3} textAlign="center" color="ink.500">
      <Box color="bone.400">
        <RegMark size={36} />
      </Box>
      <Heading as="h3" size="sm" color="ink.700">
        {title}
      </Heading>
      {description && (
        <Text fontSize="sm" maxW="46ch">
          {description}
        </Text>
      )}
      {action && <Box pt={2}>{action}</Box>}
    </VStack>
  )
}
