import { useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, FormControl, FormHelperText, HStack, Input, InputGroup, InputLeftAddon, Link, Text, Textarea, VStack } from '@chakra-ui/react'
import { FiCheckCircle, FiKey } from 'react-icons/fi'
import AuthShell from './AuthShell'
import AuthAlert from './AuthAlert'
import { cleanUsername, isValidUsername, requestAccount } from '../../lib/api/auth'
import { friendlyError } from '../../lib/supabase'
import { notifyAdmin } from '../../lib/constants'

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
            <Text fontWeight={600}>We will email you when it is approved.</Text>
            <Text fontSize="sm" color="ink.500" mt={1}>
              A shop admin reads every request, usually between jobs. Once it is approved you get a link to set your password. Until then, the press does not stop.
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
      eyebrow="Backstage"
      title="Just request access"
      intro="Backstage is for the Fishbone crew. Say who you are and a shop admin waves you in."
      headline="You are on the list."
      footer={
        <HStack spacing={2} color="ink.400">
          <Box as={FiKey} boxSize="14px" color="ember.500" />
          <Text>
            Already have a key?{' '}
            <Link as={RouterLink} to="/login/" color="ink.900" fontWeight={600}>
              Sign in
            </Link>
          </Text>
        </HStack>
      }
    >
      <Box as="form" onSubmit={submit} noValidate>
        <VStack spacing={4} align="stretch">
          <AuthAlert>{error}</AuthAlert>
          {/* No labels. The fields say what they are, and a little more. */}
          <FormControl isRequired>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Your name, the one on the time card" autoComplete="name" autoFocus aria-label="Your name" bg="white" />
          </FormControl>
          <FormControl isRequired>
            <Input type="email" value={form.email} onChange={(e) => set({ email: e.target.value })} placeholder="Your email, any kind works" autoComplete="email" aria-label="Your email" bg="white" />
          </FormControl>
          <FormControl isInvalid={!usernameOk}>
            <InputGroup>
              <InputLeftAddon bg="paper2" borderColor="bone.300">
                @
              </InputLeftAddon>
              <Input fontFamily="mono" value={form.requested_username} onChange={(e) => set({ requested_username: cleanUsername(e.target.value) })} placeholder="a username, if you have one in mind" autoCapitalize="none" spellCheck={false} aria-label="Username" bg="white" />
            </InputGroup>
            {!usernameOk && <FormHelperText color="red.600">Needs at least 2 characters, lowercase.</FormHelperText>}
          </FormControl>
          <FormControl>
            <Textarea value={form.message} onChange={(e) => set({ message: e.target.value })} rows={3} placeholder="What you do at the shop. Squeegee, screens, phones, all of it." maxLength={500} aria-label="What you do at the shop" bg="white" />
          </FormControl>
          <Button type="submit" size="lg" isLoading={loading} loadingText="Sending" mt={2}>
            Request access
          </Button>
        </VStack>
      </Box>
    </AuthShell>
  )
}
