import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Code,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftAddon,
  InputRightAddon,
  InputRightElement,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Tab,
  Table,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
  Badge,
} from '@chakra-ui/react'
import { FiEye, FiEyeOff, FiSave } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import { getAllSettings, listAdmins, upsertSetting } from '../../lib/api/settings'
import { supabase, friendlyError } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const TABS = ['store', 'ordering', 'tax', 'shipping', 'payments', 'announcement', 'admins', 'account']
const TAB_LABELS = {
  store: 'Store',
  ordering: 'Ordering',
  tax: 'Tax',
  shipping: 'Shipping',
  payments: 'Payments',
  announcement: 'Announcement',
  admins: 'Admins',
  account: 'Account',
}

function SaveBar({ onSave, saving, dirty }) {
  return (
    <HStack justify="flex-end" mt={5}>
      {dirty && (
        <Text fontSize="xs" color="ink.500">
          Unsaved changes
        </Text>
      )}
      <Button size="sm" leftIcon={<FiSave />} onClick={onSave} isLoading={saving} isDisabled={!dirty}>
        Save
      </Button>
    </HStack>
  )
}

/** Generic section wrapper: holds a draft of settings[key], saves via upsertSetting. */
function useSection(settings, key, onSaved) {
  const [draft, setDraft] = useState(settings?.[key] || {})
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  useEffect(() => setDraft(settings?.[key] || {}), [settings, key])
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings?.[key] || {})
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const save = async (isPublic) => {
    setSaving(true)
    try {
      await upsertSetting(key, draft, { is_public: isPublic })
      onSaved(key, draft)
      toast({ title: `${TAB_LABELS[key]} settings saved`, status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not save settings', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }
  return { draft, set, save, saving, dirty }
}

function StoreTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'store', onSaved)
  const social = draft.social || {}
  return (
    <Card title="Store information">
      <Stack spacing={4}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>Shop name</FormLabel>
            <Input value={draft.name || ''} onChange={(e) => set({ name: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel>Phone</FormLabel>
            <Input value={draft.phone || ''} onChange={(e) => set({ phone: e.target.value })} placeholder="(970) 626-4437" />
          </FormControl>
          <FormControl>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={draft.email || ''} onChange={(e) => set({ email: e.target.value })} placeholder="orders@fishbonegraphics.com" />
          </FormControl>
          <FormControl>
            <FormLabel>Hours</FormLabel>
            <Input value={draft.hours || ''} onChange={(e) => set({ hours: e.target.value })} placeholder="Mon–Fri 9am–5pm" />
          </FormControl>
        </SimpleGrid>
        <FormControl>
          <FormLabel>Address</FormLabel>
          <Textarea rows={2} value={draft.address || ''} onChange={(e) => set({ address: e.target.value })} placeholder="Street, Ridgway, CO 81432" />
        </FormControl>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>Instagram</FormLabel>
            <InputGroup>
              <InputLeftAddon bg="paper2" borderColor="bone.300">
                @
              </InputLeftAddon>
              <Input value={social.instagram || ''} onChange={(e) => set({ social: { ...social, instagram: e.target.value.replace(/^@/, '') } })} placeholder="fishbonegraphics" />
            </InputGroup>
          </FormControl>
          <FormControl>
            <FormLabel>Facebook URL</FormLabel>
            <Input value={social.facebook || ''} onChange={(e) => set({ social: { ...social, facebook: e.target.value } })} placeholder="https://facebook.com/…" />
          </FormControl>
        </SimpleGrid>
        <SaveBar onSave={() => save(true)} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

function OrderingTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'ordering', onSaved)
  return (
    <Card title="Ordering">
      <Stack spacing={4}>
        <FormControl maxW="240px">
          <FormLabel>Standard turnaround</FormLabel>
          <InputGroup>
            <NumberInput value={draft.turnaround_days ?? ''} min={1} max={90} onChange={(v) => set({ turnaround_days: v === '' ? '' : Number(v) })} w="full">
              <NumberInputField fontFamily="mono" borderRightRadius={0} />
            </NumberInput>
            <InputRightAddon bg="paper2" borderColor="bone.300">
              business days
            </InputRightAddon>
          </InputGroup>
          <FormHelperText color="ink.300">Shown on product pages and checkout as the expected turnaround.</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Minimum order note</FormLabel>
          <Textarea rows={2} value={draft.min_order_note || ''} onChange={(e) => set({ min_order_note: e.target.value })} placeholder="12-piece minimum per design. Mixed sizes are fine." />
        </FormControl>
        <SaveBar onSave={() => save(true)} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

function TaxTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'tax', onSaved)
  const pct = draft.rate !== undefined && draft.rate !== '' ? (Number(draft.rate) * 100).toFixed(3).replace(/\.?0+$/, '') : ''
  return (
    <Card title="Sales tax">
      <Stack spacing={4}>
        <FormControl maxW="240px">
          <FormLabel>Tax rate</FormLabel>
          <InputGroup>
            <Input fontFamily="mono" type="number" step="0.001" min={0} max={30} value={pct} onChange={(e) => set({ rate: e.target.value === '' ? '' : Math.round(Number(e.target.value) * 100000) / 10000000 })} placeholder="0" />
            <InputRightAddon bg="paper2" borderColor="bone.300">
              %
            </InputRightAddon>
          </InputGroup>
          <FormHelperText color="ink.300">
            Stored as a decimal (<Code fontSize="xs">{draft.rate ?? 0}</Code>). Applied server-side when an order is placed. Set to 0 if you handle tax on the invoice.
          </FormHelperText>
        </FormControl>
        <SaveBar onSave={() => save(true)} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

function ShippingTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'shipping', onSaved)
  return (
    <Card title="Shipping">
      <Stack spacing={4}>
        <FormControl display="flex" alignItems="center" justifyContent="space-between" maxW="420px">
          <Box>
            <FormLabel mb={0}>Offer shipping at checkout</FormLabel>
            <Text fontSize="xs" color="ink.500">
              When off, customers can only choose pickup in Ridgway.
            </Text>
          </Box>
          <Switch isChecked={Boolean(draft.enabled)} onChange={(e) => set({ enabled: e.target.checked })} />
        </FormControl>
        <FormControl maxW="240px" isDisabled={!draft.enabled}>
          <FormLabel>Flat rate</FormLabel>
          <InputGroup>
            <InputLeftAddon bg="paper2" borderColor="bone.300">
              $
            </InputLeftAddon>
            <NumberInput value={draft.flat_rate ?? ''} min={0} precision={2} onChange={(v) => set({ flat_rate: v === '' ? '' : Number(v) })} w="full">
              <NumberInputField fontFamily="mono" borderLeftRadius={0} />
            </NumberInput>
          </InputGroup>
          <FormHelperText color="ink.300">Charged once per order regardless of size.</FormHelperText>
        </FormControl>
        <SaveBar onSave={() => save(true)} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

function PaymentsTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'payments', onSaved)
  return (
    <Card title="Payments">
      <Stack spacing={4}>
        <FormControl maxW="320px">
          <FormLabel>Provider</FormLabel>
          <Select value={draft.provider || 'invoice'} onChange={(e) => set({ provider: e.target.value })}>
            <option value="invoice">Invoice (shop sends invoice after review)</option>
            <option value="stripe">Stripe</option>
            <option value="square">Square</option>
          </Select>
          <FormHelperText color="ink.300">
            Stripe and Square require keys configured on the storefront's serverless side; the storefront falls back to invoice until then.
          </FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Note shown at checkout</FormLabel>
          <Textarea rows={3} value={draft.note || ''} onChange={(e) => set({ note: e.target.value })} placeholder="We review every order and send an invoice within one business day. Nothing is charged until you approve the proof." />
        </FormControl>
        <SaveBar onSave={() => save(true)} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

function AnnouncementTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'announcement', onSaved)
  return (
    <Card title="Announcement bar">
      <Stack spacing={4}>
        <FormControl display="flex" alignItems="center" justifyContent="space-between" maxW="420px">
          <Box>
            <FormLabel mb={0}>Show on storefront</FormLabel>
            <Text fontSize="xs" color="ink.500">
              A thin bar at the top of every page.
            </Text>
          </Box>
          <Switch isChecked={Boolean(draft.enabled)} onChange={(e) => set({ enabled: e.target.checked })} />
        </FormControl>
        <FormControl>
          <FormLabel>Text</FormLabel>
          <Input value={draft.text || ''} onChange={(e) => set({ text: e.target.value })} placeholder="Festival season: order by June 1 for Telluride Bluegrass delivery." maxLength={140} />
          <FormHelperText color="ink.300">{(draft.text || '').length}/140</FormHelperText>
        </FormControl>
        {draft.enabled && draft.text && (
          <Box bg="ink.900" color="bone.500" px={4} py={2} borderRadius="base" fontSize="sm" textAlign="center">
            <Text as="span" color="hivis.400" fontFamily="heading" fontWeight={700} letterSpacing="0.1em" textTransform="uppercase" fontSize="xs" mr={2}>
              Preview
            </Text>
            {draft.text}
          </Box>
        )}
        <SaveBar onSave={() => save(true)} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

function AdminsTab() {
  const [admins, setAdmins] = useState(null)
  const [error, setError] = useState('')
  const me = useAuthStore((s) => s.user)
  useEffect(() => {
    listAdmins()
      .then(setAdmins)
      .catch((err) => setError(err.message))
  }, [])
  return (
    <Stack spacing={5}>
      <Card title="Pulse admins" p={0} sx={{ '& > div:first-of-type': { px: 5, pt: 4, mb: 2 } }}>
        {error ? (
          <Box p={4}>
            <ErrorState message={error} />
          </Box>
        ) : admins === null ? (
          <Stack p={4} spacing={2}>
            <Skeleton h="36px" />
            <Skeleton h="36px" />
          </Stack>
        ) : (
          <Table size="sm">
            <Thead>
              <Tr>
                <Th>Email</Th>
                <Th>Name</Th>
                <Th>Role</Th>
              </Tr>
            </Thead>
            <Tbody>
              {admins.map((a) => (
                <Tr key={a.user_id}>
                  <Td>
                    {a.email}
                    {a.user_id === me?.id && (
                      <Badge ml={2} bg="hivis.100" color="hivis.900" fontSize="10px">
                        You
                      </Badge>
                    )}
                  </Td>
                  <Td>{a.display_name || <Text color="ink.300">—</Text>}</Td>
                  <Td textTransform="capitalize">{a.role || 'admin'}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>
      <Card title="Adding an admin">
        <Stack spacing={3} fontSize="sm" color="ink.700">
          <Text>Admins are managed in the database, not from this screen, so a stolen Pulse session cannot mint new admins.</Text>
          <Box as="ol" pl={5}>
            <li>Have the person create an account: Supabase dashboard → Authentication → Users → “Add user” (email + password).</li>
            <li>In the SQL editor run:</li>
          </Box>
          <Code display="block" p={3} borderRadius="base" bg="ink.900" color="hivis.400" fontSize="xs" whiteSpace="pre">
            select grant_admin('person@example.com');
          </Code>
          <Text>The next time they sign in to Pulse they will have full access. To revoke, delete their row from <Code fontSize="xs">admin_users</Code>.</Text>
        </Stack>
      </Card>
    </Stack>
  )
}

function AccountTab() {
  const user = useAuthStore((s) => s.user)
  const toast = useToast()
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [show, setShow] = useState({ current: false, next: false, confirm: false })
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (passwords.next !== passwords.confirm) {
      toast({ title: 'Passwords do not match', description: 'New password and confirmation must be identical.', status: 'error' })
      return
    }
    if (passwords.next.length < 8) {
      toast({ title: 'Password too short', description: 'Use at least 8 characters.', status: 'error' })
      return
    }
    setLoading(true)
    try {
      // Verify the current password before changing it.
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: passwords.current })
      if (signInError) throw new Error('Current password is incorrect.')
      const { error } = await supabase.auth.updateUser({ password: passwords.next })
      if (error) throw error
      toast({ title: 'Password updated', status: 'success' })
      setPasswords({ current: '', next: '', confirm: '' })
    } catch (err) {
      toast({ title: 'Could not change password', description: friendlyError(err), status: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const field = (key, label, autoComplete) => (
    <FormControl isRequired>
      <FormLabel>{label}</FormLabel>
      <InputGroup>
        <Input type={show[key] ? 'text' : 'password'} value={passwords[key]} autoComplete={autoComplete} onChange={(e) => setPasswords((p) => ({ ...p, [key]: e.target.value }))} />
        <InputRightElement>
          <IconButton size="sm" variant="ghost" aria-label={show[key] ? 'Hide password' : 'Show password'} icon={show[key] ? <FiEyeOff /> : <FiEye />} onClick={() => setShow((s) => ({ ...s, [key]: !s[key] }))} tabIndex={-1} />
        </InputRightElement>
      </InputGroup>
    </FormControl>
  )

  return (
    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5} alignItems="start">
      <Card title="Signed in as">
        <Text fontWeight={600}>{user?.user_metadata?.display_name || user?.email}</Text>
        <Text fontSize="sm" color="ink.500">
          {user?.email}
        </Text>
        <Text fontSize="xs" color="ink.300" mt={3} fontFamily="mono">
          {user?.id}
        </Text>
      </Card>
      <Card title="Change password">
        <Box as="form" onSubmit={handlePasswordChange}>
          <Stack spacing={4}>
            {field('current', 'Current password', 'current-password')}
            {field('next', 'New password', 'new-password')}
            {field('confirm', 'Confirm new password', 'new-password')}
            <Button type="submit" isLoading={loading} alignSelf="flex-end" size="sm">
              Update password
            </Button>
          </Stack>
        </Box>
      </Card>
    </SimpleGrid>
  )
}

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const tabKey = params.get('tab') || 'store'
  const tabIndex = Math.max(0, TABS.indexOf(tabKey))
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setSettings(await getAllSettings())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onSaved = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const setTab = (i) => {
    const next = new URLSearchParams(params)
    if (TABS[i] === 'store') next.delete('tab')
    else next.set('tab', TABS[i])
    setParams(next, { replace: true })
  }

  const needsSettings = !['admins', 'account'].includes(tabKey)

  return (
    <MotionFade>
      <PageHeader eyebrow="Shop" title="Settings" description="Store details, pricing rules and storefront options. Changes go live on the storefront immediately." />
      <Tabs index={tabIndex} onChange={setTab} isLazy>
        <TabList mb={5} overflowX="auto">
          {TABS.map((t) => (
            <Tab key={t} fontSize="xs" px={3}>
              {TAB_LABELS[t]}
            </Tab>
          ))}
        </TabList>
        {needsSettings && error ? (
          <ErrorState message={error} onRetry={load} />
        ) : needsSettings && !settings ? (
          <Skeleton h="320px" />
        ) : (
          <TabPanels>
            <TabPanel p={0}>
              <StoreTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <OrderingTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <TaxTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <ShippingTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <PaymentsTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <AnnouncementTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <AdminsTab />
            </TabPanel>
            <TabPanel p={0}>
              <AccountTab />
            </TabPanel>
          </TabPanels>
        )}
      </Tabs>
    </MotionFade>
  )
}
