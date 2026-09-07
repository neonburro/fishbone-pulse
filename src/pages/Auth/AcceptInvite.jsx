import { useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { Box, Button, FormControl, FormHelperText, FormLabel, HStack, Input, InputGroup, InputLeftAddon, InputRightElement, Spinner, Text, VStack } from '@chakra-ui/react'
import { FiCheck, FiCheckCircle, FiX } from 'react-icons/fi'
import AuthShell from './AuthShell'
import AuthAlert from './AuthAlert'
import PasswordInput from './PasswordInput'
import { cleanUsername, consumeHashSession, isUsernameAvailable, isValidUsername, updateProfile } from '../../lib/api/auth'
import { supabase, friendlyError } from '../../lib/supabase'

function titleFromEmail(email = '') {
  return email
    .split('@')[0]
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

export default function AcceptInvite() {
  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState('')
  const [user, setUser] = useState(null)
  const [inviteType, setInviteType] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [availability, setAvailability] = useState(null) // null | 'checking' | true | false
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
      if (result.ok) setInviteType(result.type) // 'invite' | 'signup' | 'magiclink' | 'recovery'
      if (!result.ok && result.error) {
        setLinkError(/expired|invalid|otp/i.test(result.error) ? 'This invite link has expired or was already used. Ask an admin to send a new one.' : result.error)
        setReady(true)
        return
      }
      const {
        data: { user: u },
      } = await supabase.auth.getUser()
      if (cancelled) return
      if (!u) {
        setLinkError('No invite token found. Open the link from your invite email.')
        setReady(true)
        return
      }
      setUser(u)
      const meta = u.user_metadata || {}
      setDisplayName(meta.display_name || meta.full_name || titleFromEmail(u.email))
      setUsername(cleanUsername(meta.username || ''))
      setReady(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // live username availability
  useEffect(() => {
    if (!user) return undefined
    if (!username) {
      setAvailability(null)
      return undefined
    }
    if (!isValidUsername(username)) {
      setAvailability(false)
      return undefined
    }
    setAvailability('checking')
    const t = setTimeout(async () => {
      try {
        setAvailability(await isUsernameAvailable(username, user.id))
      } catch {
        setAvailability(null)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [username, user])

  const submit = async (e) => {
    e.preventDefault()
    if (!displayName.trim()) return setError('Tell us your name.')
    if (!isValidUsername(username)) return setError('Usernames are 2–32 characters: lowercase letters, numbers, dots, dashes or underscores.')
    if (availability === false) return setError('That username is taken. Pick another.')
    if (password.length < 8) return setError('Use at least 8 characters for your password.')
    if (password !== confirm) return setError('Passwords do not match.')
    setLoading(true)
    setError('')
    try {
      const { error: pwErr } = await supabase.auth.updateUser({ password, data: { display_name: displayName.trim(), username } })
      if (pwErr) throw pwErr
      const {
        data: { user: current },
      } = await supabase.auth.getUser()
      if (!current) throw new Error('Your session expired. Open the invite link again.')
      await updateProfile(current.id, { display_name: displayName.trim(), username })
      setSuccess(true)
      await supabase.auth.signOut()
      setTimeout(() => navigate('/login/', { replace: true }), 2200)
    } catch (err) {
      setError(friendlyError(err, 'Could not finish setting up your account'))
    } finally {
      setLoading(false)
    }
  }

  const heading = inviteType === 'signup' ? 'Confirm your account' : 'Accept your invite'

  return (
    <AuthShell eyebrow="Welcome to the crew" title={heading} intro={user && !success ? `You're setting up Pulse access for ${user.email}.` : undefined} headline="Pull up a squeegee.">
      {!ready ? (
        <HStack color="ink.500" fontSize="sm">
          <Spinner size="sm" color="ember.500" />
          <Text>Checking your invite…</Text>
        </HStack>
      ) : success ? (
        <HStack align="flex-start" spacing={3} bg="white" p={4} borderRadius="base" boxShadow="card">
          <Box color="river.500" mt="2px" fontSize="20px">
            <FiCheckCircle />
          </Box>
          <Box>
            <Text fontWeight={600}>You're in.</Text>
            <Text fontSize="sm" color="ink.500">
              Sign in with <b>@{username}</b> and your new password. Taking you there…
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
              <FormLabel>Your name</FormLabel>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Rae Fisher" autoComplete="name" size="lg" autoFocus />
            </FormControl>
            <FormControl isRequired isInvalid={availability === false}>
              <FormLabel>Pick a username</FormLabel>
              <InputGroup size="lg">
                <InputLeftAddon bg="paper2" borderColor="bone.300">
                  @
                </InputLeftAddon>
                <Input fontFamily="mono" value={username} onChange={(e) => setUsername(cleanUsername(e.target.value))} placeholder="rfisher" autoComplete="username" autoCapitalize="none" spellCheck={false} />
                {username && (
                  <InputRightElement color={availability === true ? 'green.500' : availability === false ? 'red.500' : 'ink.300'}>
                    {availability === 'checking' ? <Spinner size="xs" /> : availability === true ? <FiCheck /> : availability === false ? <FiX /> : null}
                  </InputRightElement>
                )}
              </InputGroup>
              <FormHelperText color={availability === false ? 'red.600' : 'ink.300'}>
                {availability === false
                  ? isValidUsername(username)
                    ? 'That username is taken.'
                    : 'Lowercase letters, numbers, dots, dashes or underscores. 2–32 characters.'
                  : 'You will use this to sign in. Lowercase letters, numbers, dots, dashes or underscores.'}
              </FormHelperText>
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <PasswordInput autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Confirm password</FormLabel>
              <PasswordInput autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" />
            </FormControl>
            <Button type="submit" size="lg" isLoading={loading} loadingText="Setting up" mt={2}>
              Finish setup
            </Button>
          </VStack>
        </Box>
      )}
    </AuthShell>
  )
}
