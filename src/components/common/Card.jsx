import { Box, Heading, HStack } from '@chakra-ui/react'

export default function Card({ title, action, children, p = 5, ...rest }) {
  return (
    <Box bg="white" borderRadius="base" boxShadow="card" p={p} {...rest}>
      {(title || action) && (
        <HStack justify="space-between" mb={4} align="center">
          {title && (
            <Heading as="h3" size="sm" color="ink.900">
              {title}
            </Heading>
          )}
          {action}
        </HStack>
      )}
      {children}
    </Box>
  )
}
