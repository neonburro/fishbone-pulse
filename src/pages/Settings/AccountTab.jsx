import { useEffect, useState } from 'react'
import { Badge, Box, Button, Divider, FormControl, FormHelperText, FormLabel, HStack, Input, InputGroup, InputLeftAddon, InputRightElement, SimpleGrid, Spinner, Stack, Text, useToast } from '@chakra-ui/react'
import { FiCheck, FiX } from 'react-icons/fi'
import Card from '../../components/common/Card'
import PasswordInput from '../Auth/PasswordInput'
import { useAuth } from '../../hooks/useAuth'
import { cleanUsername, isUsernameAvailable, isValidUsername, updateProfile } from '../../lib/api/auth'
import { supabase, friendlyError } from '../../lib/supabase'
import { setAvatar, clearAvatar } from '../../lib/api/crew'
import MemberAvatar from '../../components/crew/MemberAvatar'
import { useRef } from 'react'
import { formatDate, formatDateTime } from '../../utils/format'

function ProfileCard() {
  const { user, profile, refreshProfile } = useAuth()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(profile?.display_name || '')
  const [username, setUsername] = useState(profile?.username || '')
  const [availability, setAvailability] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setDisplayName(profile?.display_name || '')
    setUsername(profile?.username || '')
  }, [profile])

  const changed = username !== (profile?.username || '')
  useEffect(() => {
    if (!changed || !username) {
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
        setAvailability(await isUsernameAvailable(username, user?.id))
      } catch {
        setAvailability(null)
      }
    }, 350)
    return () => clearTimeout(t)
  }, [username, changed, user?.id])

  const dirty = displayName !== (profile?.display_name || '') || changed

  const save = async () => {
    if (!displayName.trim()) return toast({ title: 'Display name is required', status: 'warning' })
    if (!isValidUsername(username)) return toast({ title: 'Invalid username', description: 'Lowercase letters, numbers, dots, dashes or underscores. 2–32 characters.', status: 'warning' })
    if (changed && availability === false) return toast({ title: 'That username is taken', status: 'warning' })
    setSaving(true)
    try {
      await updateProfile(user.id, { display_name: displayName.trim(), username })
      await refreshProfile()
      toast({ title: 'Profile saved', status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not save profile', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const fileRef = useRef(null)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const pickAvatar = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/^image\//.test(file.type)) return toast({ title: 'Pick an image', status: 'warning' })
    if (file.size > 4 * 1024 * 1024) return toast({ title: 'Keep it under 4 MB', status: 'warning' })
    setAvatarBusy(true)
    try { await setAvatar(user.id, file); await refreshProfile(); toast({ title: 'Avatar set', status: 'success', duration: 1500 }) }
    catch (err) { toast({ title: 'Could not set avatar', description: err.message, status: 'error' }) }
    finally { setAvatarBusy(false) }
  }
  const dropAvatar = async () => {
    setAvatarBusy(true)
    try { await clearAvatar(user.id); await refreshProfile() } catch (err) { toast({ title: 'Could not remove avatar', description: err.message, status: 'error' }) } finally { setAvatarBusy(false) }
  }

  return (
    <Card title="Profile">
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Your face</FormLabel>
          <HStack spacing={4}>
            <MemberAvatar member={{ name: displayName || profile?.display_name, avatar_url: profile?.avatar_url, online: true }} size="lg" presence={false} />
            <Stack spacing={1}>
              <HStack>
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} isLoading={avatarBusy}>{profile?.avatar_url ? 'Change' : 'Pick a photo'}</Button>
                {profile?.avatar_url && <Button size="sm" variant="ghost" onClick={dropAvatar} isDisabled={avatarBusy}>Remove</Button>}
              </HStack>
              <FormHelperText color="ink.300" mt={0}>Shows at the bottom of the sidebar and in the online strip. Square photos work best.</FormHelperText>
            </Stack>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickAvatar} />
          </HStack>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Display name</FormLabel>
          <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Rae Fisher" />
          <FormHelperText color="ink.300">Shown in the top bar, on timeline notes and in the activity log.</FormHelperText>
        </FormControl>
        <FormControl isRequired isInvalid={availability === false}>
          <FormLabel>Username</FormLabel>
          <InputGroup>
            <InputLeftAddon bg="paper2" borderColor="bone.300">
              @
            </InputLeftAddon>
            <Input fontFamily="mono" value={username} onChange={(e) => setUsername(cleanUsername(e.target.value))} placeholder="rfisher" autoCapitalize="none" spellCheck={false} />
            {changed && username && (
              <InputRightElement color={availability === true ? 'green.500' : availability === false ? 'red.500' : 'ink.300'}>
                {availability === 'checking' ? <Spinner size="xs" /> : availability === true ? <FiCheck /> : availability === false ? <FiX /> : null}
              </InputRightElement>
            )}
          </InputGroup>
          <FormHelperText color={availability === false ? 'red.600' : 'ink.300'}>
            {availability === false ? (isValidUsername(username) ? 'That username is taken.' : '2–32 characters: lowercase letters, numbers, dots, dashes, underscores.') : 'Used to sign in. Lowercase letters, numbers, dots, dashes, underscores.'}
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <HStack h="40px" px={3} borderRadius="base" border="1px solid" borderColor="bone.200" bg="paper2">
            <Text fontSize="sm" flex="1">
              {user?.email}
            </Text>
            <Text fontSize="xs" color="ink.300" fontFamily="mono">
              read only
            </Text>
          </HStack>
        </FormControl>
        <HStack justify="flex-end">
          <Button size="sm" onClick={save} isLoading={saving} isDisabled={!dirty}>
            Save profile
          </Button>
        </HStack>
      </Stack>
    </Card>
  )
}

function PasswordCard() {
  const { user } = useAuth()
  const toast = useToast()
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (pw.next.length < 8) return toast({ title: 'Password too short', description: 'Use at least 8 characters.', status: 'warning' })
    if (pw.next !== pw.confirm) return toast({ title: 'Passwords do not match', status: 'warning' })
    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.current })
      if (signInError) throw new Error('Current password is incorrect.')
      const { error } = await supabase.auth.updateUser({ password: pw.next })
      if (error) throw error
      toast({ title: 'Password updated', status: 'success' })
      setPw({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast({ title: 'Could not change password', description: friendlyError(err), status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Password">
      <Box as="form" onSubmit={submit}>
        <Stack spacing={4}>
          <FormControl isRequired>
            <FormLabel>Current password</FormLabel>
            <PasswordInput size="md" autoComplete="current-password" value={pw.current} onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))} />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>New password</FormLabel>
            <PasswordInput size="md" autoComplete="new-password" value={pw.next} onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))} placeholder="At least 8 characters" />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Confirm new password</FormLabel>
            <PasswordInput size="md" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))} />
          </FormControl>
          <HStack justify="flex-end">
            <Button type="submit" size="sm" isLoading={loading} isDisabled={!pw.current || !pw.next || !pw.confirm}>
              Change password
            </Button>
          </HStack>
        </Stack>
      </Box>
    </Card>
  )
}

function InfoRow({ label, value, mono }) {
  return (
    <HStack justify="space-between" py={2.5}>
      <Text fontSize="sm" color="ink.500">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight={600} fontFamily={mono ? 'mono' : undefined}>
        {value}
      </Text>
    </HStack>
  )
}

function AccountInfoCard() {
  const { user, profile, role } = useAuth()
  return (
    <Card title="Account info">
      <Stack spacing={0} divider={<Divider borderColor="bone.200" />}>
        <InfoRow
          label="Role"
          value={
            <Badge bg={role === 'owner' ? 'ember.100' : role === 'admin' ? 'river.100' : 'bone.200'} color={role === 'owner' ? 'ember.800' : role === 'admin' ? 'river.800' : 'ink.700'}>
              {role || 'staff'}
            </Badge>
          }
        />
        <InfoRow label="Member since" value={formatDate(profile?.created_at || user?.created_at)} />
        <InfoRow label="Last login" value={user?.last_sign_in_at ? formatDateTime(user.last_sign_in_at) : 'First session'} />
        <InfoRow label="User ID" value={user?.id ? `${user.id.slice(0, 8)}…` : '—'} mono />
      </Stack>
    </Card>
  )
}

export default function AccountTab() {
  return (
    <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5} alignItems="start">
      <Stack spacing={5}>
        <ProfileCard />
        <AccountInfoCard />
      </Stack>
      <PasswordCard />
    </SimpleGrid>
  )
}
