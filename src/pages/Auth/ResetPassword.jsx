import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Button, FormControl, FormLabel, HStack, Link, Spinner, Text, VStack } from '@chakra-ui/react'
import { FiCheckCircle } from 'react-icons/fi'
import AuthShell from './AuthShell'
import AuthAlert from './AuthAlert'
import PasswordInput from './PasswordInput'
import { consumeHashSession } from '../../lib/api/auth'
import { supabase, friendlyError } from '../../lib/supabase'

export default function ResetPassword() {
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const result = await consumeHashSession()
      if (cancelled) return
      if (result.ok) {
        setReady(true)
        return
      }
      if (result.error) {
        setLinkError(/expired|invalid|otp/i.test(result.error) ? 'This reset link has expired or was already used. Request a new one from the sign-in page.' : result.error)
      } else {
        // No tokens in the URL. A still-valid session (e.g. reloaded page) can proceed; otherwise explain.
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (cancelled) return
        if (!session) setLinkError('No reset token found. Open the link from your email, or request a new one.')
      }
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Use at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    try {
      const { error: updErr } = await supabase.auth.updateUser({ password })
      if (updErr) throw updErr
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login/', { replace: true }), 2000)
    } catch (err) {
      setError(friendlyError(err, 'Could not update your password'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell eyebrow="Account" title="Reset password" intro={linkError ? undefined : 'Pick a new password for your Pulse account.'} headline="Back on press in a minute.">
      {!ready ? (
        <HStack color="ink.500" fontSize="sm">
          <Spinner size="sm" color="ember.500" />
          <Text>Checking your link…</Text>
        </HStack>
      ) : success ? (
        <HStack align="flex-start" spacing={3} bg="white" p={4} borderRadius="base" boxShadow="card">
          <Box color="river.500" mt="2px" fontSize="20px">
            <FiCheckCircle />
          </Box>
          <Box>
            <Text fontWeight={600}>Password updated.</Text>
            <Text fontSize="sm" color="ink.500">
              Taking you to sign in…
            </Text>
          </Box>
        </HStack>
      ) : linkError ? (
        <VStack align="stretch" spacing={4}>
          <AuthAlert status="warning">{linkError}</AuthAlert>
          <Button as={RouterLink} to="/login/" variant="outline">
            Back to sign in
          </Button>
        </VStack>
      ) : (
        <Box as="form" onSubmit={submit} noValidate>
          <VStack spacing={4} align="stretch">
            <AuthAlert>{error}</AuthAlert>
            <FormControl isRequired>
              <FormLabel>New password</FormLabel>
              <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoFocus />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm new password</FormLabel>
              <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" />
            </FormControl>
            <Button type="submit" size="lg" isLoading={loading} loadingText="Updating" mt={2}>
              Update password
            </Button>
            <Text fontSize="xs" color="ink.300" textAlign="center">
              You will be signed out and asked to sign in with the new password.{' '}
              <Link as={RouterLink} to="/login/" color="river.600">
                Cancel
              </Link>
            </Text>
          </VStack>
        </Box>
      )}
    </AuthShell>
  )
}
