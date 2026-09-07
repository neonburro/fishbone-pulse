import { Button, Center, Heading, Text, VStack } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import RegMark from '../components/common/RegMark'

export default function NotFound() {
  return (
    <Center minH="60vh">
      <VStack spacing={3} textAlign="center">
        <RegMark size={40} color="#FF6A13" />
        <Heading size="lg">Page not found</Heading>
        <Text color="ink.500" fontSize="sm">
          That route is not on the job board.
        </Text>
        <Button as={RouterLink} to="/" variant="outline" size="sm">
          Back to dashboard
        </Button>
      </VStack>
    </Center>
  )
}
