import { useEffect, useState } from 'react'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { Box, Button, Collapse, FormControl, FormLabel, HStack, Input, Link, Text, VStack } from '@chakra-ui/react'
import { FiLock, FiMail } from 'react-icons/fi'
import AuthShell from './Auth/AuthShell'
import AuthAlert from './Auth/AuthAlert'
import PasswordInput from './Auth/PasswordInput'
import { useAuth } from '../hooks/useAuth'
import { sendPasswordReset } from '../lib/api/auth'
import { friendlyError, supabaseConfigured } from '../lib/supabase'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(supabaseConfigured ? '' : 'Supabase is not configured. Copy .env.example to .env and restart.')
  const [showForgot, setShowForgot] = useState(false)
  const [resetId, setResetId] = useState('')
  const [resetSent, setResetSent] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { status, signIn } = useAuth()

  const from = typeof location.state?.from === 'string' && location.state.from !== '/login/' ? location.state.from : '/'

  useEffect(() => {
    if (status === 'admin' || status === 'not_admin') navigate(from, { replace: true })
  }, [status, navigate, from])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!identifier.trim() || !password) {
      setError('Enter your username or email, and your password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signIn(identifier, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyError(err, 'Sign in failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    const id = (resetId || identifier).trim()
    if (!id) {
      setError('Enter the email or username for the account.')
      return
    }
    setResetLoading(true)
    setError('')
    try {
      const email = await sendPasswordReset(id)
      setResetSent(email)
    } catch (err) {
      setError(friendlyError(err, 'Could not send the reset email'))
    } finally {
      setResetLoading(false)
    }
  }

  return (
    <AuthShell
      title="Sign in"
      intro="Team access only. Use your Pulse username or the email on your account."
      footer={
        <Text>
          Need access?{' '}
          <Link as={RouterLink} to="/request-account/" color="river.600" fontWeight={600}>
            Request an account
          </Link>{' '}
          and a shop admin will approve it.
        </Text>
      }
    >
      <Box as="form" onSubmit={handleSubmit} noValidate>
        <VStack spacing={4} align="stretch">
          <AuthAlert>{error}</AuthAlert>
          <FormControl isRequired>
            <FormLabel htmlFor="identifier">Username or email</FormLabel>
            <Input
              id="identifier"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="treagan or you@fishbonegraphics.com"
              size="lg"
              autoFocus
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel htmlFor="password">Password</FormLabel>
            <PasswordInput id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </FormControl>
          <Button type="submit" size="lg" colorScheme="ember" isLoading={loading} loadingText="Signing in" w="full" mt={2}>
            Sign in
          </Button>
          <HStack justify="center" pt={1}>
            <Button
              variant="link"
              size="sm"
              leftIcon={<FiLock />}
              color="ink.500"
              fontFamily="body"
              textTransform="none"
              letterSpacing="normal"
              fontWeight={500}
              onClick={() => {
                setShowForgot((v) => !v)
                setResetSent('')
                setError('')
              }}
            >
              Forgot your password?
            </Button>
          </HStack>
        </VStack>
      </Box>

      <Collapse in={showForgot} animateOpacity unmountOnExit>
        <Box mt={4} p={4} bg="white" borderRadius="base" boxShadow="card">
          {resetSent ? (
            <HStack align="flex-start" spacing={3}>
              <Box color="river.500" mt="2px">
                <FiMail />
              </Box>
              <Box>
                <Text fontWeight={600}>Check your inbox.</Text>
                <Text fontSize="sm" color="ink.500">
                  A reset link is on its way to <b>{resetSent}</b>. It expires in about an hour.
                </Text>
              </Box>
            </HStack>
          ) : (
            <VStack spacing={3} align="stretch">
              <Text fontSize="sm" color="ink.500">
                Enter your email or username and we will send a reset link.
              </Text>
              <Input
                type="text"
                value={resetId}
                onChange={(e) => setResetId(e.target.value)}
                placeholder={identifier || 'you@fishbonegraphics.com'}
                autoComplete="email"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleReset()
                  }
                }}
              />
              <Button variant="outline" onClick={handleReset} isLoading={resetLoading} loadingText="Sending">
                Send reset link
              </Button>
            </VStack>
          )}
        </Box>
      </Collapse>
    </AuthShell>
  )
}
