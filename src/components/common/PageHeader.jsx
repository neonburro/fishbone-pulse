import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react'
import PulledRule from './PulledRule'

export default function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <Flex
      direction={{ base: 'column', md: 'row' }}
      align={{ base: 'stretch', md: 'flex-end' }}
      justify="space-between"
      gap={4}
      mb={6}
    >
      <Box>
        {eyebrow && (
          <Text
            fontFamily="heading"
            fontWeight={600}
            fontSize="xs"
            letterSpacing="0.12em"
            textTransform="uppercase"
            color="ink.500"
            mb={1}
          >
            {eyebrow}
          </Text>
        )}
        <Heading as="h1" size="lg" lineHeight="1">
          {title}
        </Heading>
        <PulledRule mt={2} />
        {description && (
          <Text color="ink.500" mt={2} fontSize="sm" maxW="60ch">
            {description}
          </Text>
        )}
        {children}
      </Box>
      {actions && (
        <HStack spacing={2} flexWrap="wrap" justify={{ base: 'flex-start', md: 'flex-end' }}>
          {actions}
        </HStack>
      )}
    </Flex>
  )
}
