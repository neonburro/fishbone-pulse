import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Center, Spinner, Text, VStack } from '@chakra-ui/react'
import { useAuthStore } from '../../store/authStore'
import NotAuthorized from '../../pages/NotAuthorized'

/**
 * Requires an active session AND a row in admin_users for that user.
 * - no session   -> /login
 * - not an admin -> "Not authorized for Pulse" screen with sign-out
 */
export default function ProtectedRoute({ children }) {
  const status = useAuthStore((s) => s.status)
  const init = useAuthStore((s) => s.init)
  const location = useLocation()

  useEffect(() => {
    if (status === 'loading') init()
  }, [status, init])

  if (status === 'loading') {
    return (
      <Center minH="100vh" bg="paper">
        <VStack spacing={3}>
          <Spinner size="lg" color="ember.500" thickness="3px" speed="0.7s" />
          <Text fontSize="sm" color="ink.500" fontFamily="heading" textTransform="uppercase" letterSpacing="0.1em">
            Checking access
          </Text>
        </VStack>
      </Center>
    )
  }

  if (status === 'signed_out') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (status === 'not_admin') {
    return <NotAuthorized />
  }

  return children
}
