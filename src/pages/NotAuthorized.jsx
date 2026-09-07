import { Box, Button, Center, Code, Heading, Text, VStack } from '@chakra-ui/react'
import Logo from '../components/brand/Logo'
import { useAuth } from '../hooks/useAuth'
import { ADMIN_CONTACT_EMAIL } from '../lib/constants'

export default function NotAuthorized() {
  const { user, signOut, error } = useAuth()
  return (
    <Center minH="100vh" bg="ink.900" px={4}>
      <VStack spacing={6} maxW="460px" textAlign="center">
        <Logo tone="dark" size={44} />
        <Box w="full" bg="ink.800" border="1px solid" borderColor="ink.600" borderRadius="base" p={8}>
          <Heading size="lg" color="bone.500" mb={2}>
            Not authorized for Pulse
          </Heading>
          <Text color="bone.300" fontSize="sm">
            You are signed in as <Code bg="ink.700" color="hivis.400">{user?.email}</Code> but this account is not on the
            team list. Ask a shop admin to add you, then sign in again.
          </Text>
          {error && (
            <Text color="ember.400" fontSize="xs" mt={3}>
              {error}
            </Text>
          )}
          <Text color="bone.400" fontSize="xs" mt={5}>
            Contact <Code bg="ink.700" color="bone.500" fontSize="xs">{ADMIN_CONTACT_EMAIL}</Code> or, for the very first owner, run in the Supabase SQL editor:
            <br />
            <Code bg="ink.700" color="bone.500" fontSize="xs" mt={1}>
              select grant_admin('{user?.email || 'you@example.com'}');
            </Code>
          </Text>
          <Button mt={6} colorScheme="ember" onClick={signOut} w="full">
            Sign out
          </Button>
        </Box>
        <Text color="bone.400" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" fontFamily="heading">
          Fishbone Graphics · Ridgway, Colorado · Since 1985
        </Text>
      </VStack>
    </Center>
  )
}
