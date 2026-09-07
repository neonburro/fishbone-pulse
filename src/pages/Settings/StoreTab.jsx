import { Box, Button, FormControl, FormHelperText, FormLabel, HStack, IconButton, Input, InputGroup, InputLeftAddon, NumberInput, NumberInputField, SimpleGrid, Stack, Text, Textarea } from '@chakra-ui/react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import Card from '../../components/common/Card'
import SaveBar from './SaveBar'
import { useSection } from './useSection'

const DAY_PRESETS = ['Mon–Fri', 'Sat', 'Sun', 'Mon–Sat', 'Sat–Sun']

function HoursEditor({ value = [], onChange }) {
  const rows = Array.isArray(value) ? value : []
  const update = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  const remove = (i) => onChange(rows.filter((_, idx) => idx !== i))
  return (
    <Stack spacing={2}>
      {rows.length === 0 && (
        <Text fontSize="sm" color="ink.300">
          No hours listed. The storefront will show “By appointment”.
        </Text>
      )}
      {rows.map((row, i) => (
        <HStack key={i} align="center" spacing={2} flexWrap={{ base: 'wrap', md: 'nowrap' }}>
          <Input size="sm" value={row.days || ''} onChange={(e) => update(i, { days: e.target.value })} placeholder="Mon–Fri" list={`hours-days-${i}`} flex="1.4" minW="120px" />
          <datalist id={`hours-days-${i}`}>
            {DAY_PRESETS.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
          <Input size="sm" value={row.open || ''} onChange={(e) => update(i, { open: e.target.value })} placeholder="9:00 AM" fontFamily="mono" flex="1" minW="100px" />
          <Text fontSize="xs" color="ink.300">
            to
          </Text>
          <Input size="sm" value={row.close || ''} onChange={(e) => update(i, { close: e.target.value })} placeholder="5:00 PM" fontFamily="mono" flex="1" minW="100px" />
          <IconButton size="sm" variant="ghost" colorScheme="red" aria-label="Remove hours row" icon={<FiTrash2 />} onClick={() => remove(i)} />
        </HStack>
      ))}
      <Button size="sm" variant="outline" leftIcon={<FiPlus />} alignSelf="flex-start" onClick={() => onChange([...rows, { days: '', open: '', close: '' }])}>
        Add hours
      </Button>
      <FormHelperText color="ink.300" mt={0}>
        Use “Closed” in the open field for days you are shut, e.g. Sun · Closed.
      </FormHelperText>
    </Stack>
  )
}

function LandmarksEditor({ value = [], onChange }) {
  const rows = Array.isArray(value) ? value : []
  const update = (i, patch) => onChange(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)))
  return (
    <Stack spacing={2}>
      {rows.map((row, i) => (
        <HStack key={i} spacing={2}>
          <Input size="sm" value={row.name || ''} onChange={(e) => update(i, { name: e.target.value })} placeholder="Ridgway Town Park" flex="2" />
          <Input size="sm" value={row.distance || ''} onChange={(e) => update(i, { distance: e.target.value })} placeholder="1 block" flex="1" />
          <IconButton size="sm" variant="ghost" colorScheme="red" aria-label="Remove landmark" icon={<FiTrash2 />} onClick={() => onChange(rows.filter((_, idx) => idx !== i))} />
        </HStack>
      ))}
      <Button size="sm" variant="outline" leftIcon={<FiPlus />} alignSelf="flex-start" onClick={() => onChange([...rows, { name: '', distance: '' }])}>
        Add landmark
      </Button>
    </Stack>
  )
}

export default function StoreTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'store', 'Store', onSaved)
  return (
    <Stack spacing={5}>
      <Card title="Identity">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>Shop name</FormLabel>
            <Input value={draft.name || ''} onChange={(e) => set({ name: e.target.value })} />
          </FormControl>
          <FormControl>
            <FormLabel>Legal name</FormLabel>
            <Input value={draft.legal_name || ''} onChange={(e) => set({ legal_name: e.target.value })} placeholder="Fishbone Graphics LLC" />
          </FormControl>
          <FormControl gridColumn={{ md: '1 / -1' }}>
            <FormLabel>Tagline</FormLabel>
            <Input value={draft.tagline || ''} onChange={(e) => set({ tagline: e.target.value })} placeholder="Hand-pulled in Ridgway since 1985" />
          </FormControl>
          <FormControl maxW="200px">
            <FormLabel>Founded</FormLabel>
            <NumberInput value={draft.founded ?? ''} min={1900} max={2100} onChange={(v) => set({ founded: v === '' ? null : parseInt(v, 10) })}>
              <NumberInputField fontFamily="mono" />
            </NumberInput>
          </FormControl>
        </SimpleGrid>
      </Card>

      <Card title="Contact">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <FormControl>
            <FormLabel>Phone</FormLabel>
            <Input value={draft.phone || ''} onChange={(e) => set({ phone: e.target.value })} placeholder="(970) 626-4437" />
          </FormControl>
          <FormControl>
            <FormLabel>Public email</FormLabel>
            <Input type="email" value={draft.email || ''} onChange={(e) => set({ email: e.target.value })} placeholder="orders@fishbonegraphics.com" />
            <FormHelperText color="ink.300">Shown on the storefront contact page.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Admin email</FormLabel>
            <Input type="email" value={draft.admin_email || ''} onChange={(e) => set({ admin_email: e.target.value })} placeholder="fishbonegraphics@neonburro.com" />
            <FormHelperText color="ink.300">Receives order and account-request notifications; shown on the request-account screen.</FormHelperText>
          </FormControl>
          <FormControl>
            <FormLabel>Instagram</FormLabel>
            <InputGroup>
              <InputLeftAddon bg="paper2" borderColor="bone.300">
                @
              </InputLeftAddon>
              <Input value={draft.instagram || ''} onChange={(e) => set({ instagram: e.target.value.replace(/^@/, '') })} placeholder="fishbonegraphics" />
            </InputGroup>
          </FormControl>
          <FormControl gridColumn={{ md: '1 / -1' }}>
            <FormLabel>Facebook URL</FormLabel>
            <Input value={draft.facebook || ''} onChange={(e) => set({ facebook: e.target.value })} placeholder="https://facebook.com/…" />
          </FormControl>
        </SimpleGrid>
      </Card>

      <Card title="Address">
        <SimpleGrid columns={{ base: 1, md: 6 }} spacing={4}>
          <FormControl gridColumn={{ md: 'span 3' }}>
            <FormLabel>Address line 1</FormLabel>
            <Input value={draft.address1 || ''} onChange={(e) => set({ address1: e.target.value })} placeholder="123 N Lena St" />
          </FormControl>
          <FormControl gridColumn={{ md: 'span 3' }}>
            <FormLabel>Address line 2</FormLabel>
            <Input value={draft.address2 || ''} onChange={(e) => set({ address2: e.target.value })} placeholder="Suite, unit, back door" />
          </FormControl>
          <FormControl gridColumn={{ md: 'span 3' }}>
            <FormLabel>City</FormLabel>
            <Input value={draft.city || ''} onChange={(e) => set({ city: e.target.value })} placeholder="Ridgway" />
          </FormControl>
          <FormControl gridColumn={{ md: 'span 1' }}>
            <FormLabel>State</FormLabel>
            <Input value={draft.state || ''} onChange={(e) => set({ state: e.target.value.toUpperCase().slice(0, 2) })} placeholder="CO" fontFamily="mono" />
          </FormControl>
          <FormControl gridColumn={{ md: 'span 2' }}>
            <FormLabel>ZIP</FormLabel>
            <Input value={draft.zip || ''} onChange={(e) => set({ zip: e.target.value })} placeholder="81432" fontFamily="mono" />
          </FormControl>
          <FormControl gridColumn={{ md: '1 / -1' }}>
            <FormLabel>Map link</FormLabel>
            <Input value={draft.map_url || ''} onChange={(e) => set({ map_url: e.target.value })} placeholder="https://maps.app.goo.gl/…" />
          </FormControl>
        </SimpleGrid>
      </Card>

      <Card title="Hours">
        <HoursEditor value={draft.hours} onChange={(hours) => set({ hours })} />
      </Card>

      <Card title="Location & directions">
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <FormControl>
            <FormLabel>Latitude</FormLabel>
            <Input type="number" step="0.000001" fontFamily="mono" value={draft.lat ?? ''} onChange={(e) => set({ lat: e.target.value === '' ? null : Number(e.target.value) })} placeholder="38.152500" />
          </FormControl>
          <FormControl>
            <FormLabel>Longitude</FormLabel>
            <Input type="number" step="0.000001" fontFamily="mono" value={draft.lng ?? ''} onChange={(e) => set({ lng: e.target.value === '' ? null : Number(e.target.value) })} placeholder="-107.761500" />
          </FormControl>
          <FormControl>
            <FormLabel>Plus code</FormLabel>
            <Input fontFamily="mono" value={draft.plus_code || ''} onChange={(e) => set({ plus_code: e.target.value })} placeholder="5624+XX Ridgway" />
          </FormControl>
          <FormControl>
            <FormLabel>Elevation (ft)</FormLabel>
            <Input type="number" fontFamily="mono" value={draft.elevation_ft ?? ''} onChange={(e) => set({ elevation_ft: e.target.value === '' ? null : Number(e.target.value) })} placeholder="6985" />
          </FormControl>
          <FormControl gridColumn={{ md: 'span 2' }}>
            <FormLabel>Region</FormLabel>
            <Input value={draft.region || ''} onChange={(e) => set({ region: e.target.value })} placeholder="Uncompahgre Valley" />
          </FormControl>
          <FormControl gridColumn={{ md: '1 / -1' }}>
            <FormLabel>Directions note</FormLabel>
            <Textarea rows={2} value={draft.directions_note || ''} onChange={(e) => set({ directions_note: e.target.value })} placeholder="Corner of Lena and Clinton, across from the town park. Park on Lena." />
          </FormControl>
          <FormControl gridColumn={{ md: '1 / -1' }}>
            <FormLabel>Nearby landmarks</FormLabel>
            <LandmarksEditor value={draft.landmarks} onChange={(landmarks) => set({ landmarks })} />
          </FormControl>
        </SimpleGrid>
      </Card>

      <Box>
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </Box>
    </Stack>
  )
}
