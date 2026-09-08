import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, FormControl, FormHelperText, FormLabel, HStack, Input, InputGroup, InputLeftAddon, Link, Text, Textarea, VStack } from '@chakra-ui/react'
import { FiCheckCircle } from 'react-icons/fi'
import AuthShell from './AuthShell'
import AuthAlert from './AuthAlert'
import { cleanUsername, isValidUsername, requestAccount } from '../../lib/api/auth'
import { friendlyError } from '../../lib/supabase'
import { ADMIN_CONTACT_EMAIL, notifyAdmin } from '../../lib/constants'

export default function RequestAccount() {
  const [form, setForm] = useState({ name: '', email: '', requested_username: '', message: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const usernameOk = !form.requested_username || isValidUsername(form.requested_username)

  const submit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return setError('Tell us your name.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return setError('Enter a valid email address.')
    if (!usernameOk) return setError('Usernames are 2–32 characters: lowercase letters, numbers, dots, dashes or underscores.')
    setLoading(true)
    setError('')
    try {
      await requestAccount(form)
      notifyAdmin({ kind: 'account_request', name: form.name, email: form.email, description: form.message, extra: { 'Wants username': form.requested_username || '' } })
      setDone(true)
    } catch (err) {
      setError(friendlyError(err, 'Could not send your request'))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <AuthShell eyebrow="Request sent" title="You're on the list" headline="You are on the list.">
        <HStack align="flex-start" spacing={3} bg="white" p={4} borderRadius="base" boxShadow="card">
          <Box color="ember.500" mt="2px" fontSize="20px">
            <FiCheckCircle />
          </Box>
          <Box>
            <Text fontWeight={600}>We'll email you when it's approved.</Text>
            <Text fontSize="sm" color="ink.500" mt={1}>
              A shop admin reviews every request. Once approved you will get an invite link to set your password. Questions? Write to{' '}
              <Link href={`mailto:${ADMIN_CONTACT_EMAIL}`} color="ink.900" fontWeight={600}>
                {ADMIN_CONTACT_EMAIL}
              </Link>
              .
            </Text>
          </Box>
        </HStack>
        <Button as={RouterLink} to="/login/" variant="outline" mt={6} w="full">
          Back to sign in
        </Button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Fishbone Pulse"
      title="Request an account"
      intro="Pulse is for the Fishbone crew. Tell us who you are and an admin will set you up."
      headline="You are on the list."
      footer={
        <Text>
          Already have access?{' '}
          <Link as={RouterLink} to="/login/" color="ink.900" fontWeight={600}>
            Sign in
          </Link>
          . Admin contact:{' '}
          <Link href={`mailto:${ADMIN_CONTACT_EMAIL}`} color="ink.900">
            {ADMIN_CONTACT_EMAIL}
          </Link>
        </Text>
      }
    >
      <Box as="form" onSubmit={submit} noValidate>
        <VStack spacing={4} align="stretch">
          <AuthAlert>{error}</AuthAlert>
          <FormControl isRequired>
            <FormLabel>Your name</FormLabel>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Rae Fisher" autoComplete="name" autoFocus />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="you@fishbonegraphics.com" autoComplete="email" />
          </FormControl>
          <FormControl isInvalid={!usernameOk}>
            <FormLabel>Desired username</FormLabel>
            <InputGroup>
              <InputLeftAddon bg="paper2" borderColor="bone.300">
                @
              </InputLeftAddon>
              <Input fontFamily="mono" value={form.requested_username} onChange={(e) => set({ requested_username: cleanUsername(e.target.value) })} placeholder="rfisher" autoCapitalize="none" spellCheck={false} />
            </InputGroup>
            <FormHelperText color={usernameOk ? 'ink.300' : 'red.600'}>
              {usernameOk ? 'Optional. Lowercase letters, numbers, dots, dashes, underscores. 2–32 characters.' : 'Needs at least 2 characters.'}
            </FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Short message</FormLabel>
            <Textarea value={form.message} onChange={(e) => set({ message: e.target.value })} rows={3} placeholder="What you do at the shop and what you need Pulse for." maxLength={500} />
          </FormControl>
          <Button type="submit" size="lg" isLoading={loading} loadingText="Sending" mt={2}>
            Send request
          </Button>
        </VStack>
      </Box>
    </AuthShell>
  )
}
