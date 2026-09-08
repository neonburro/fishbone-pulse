import { Box, Checkbox, Code, FormControl, FormHelperText, FormLabel, Input, InputGroup, InputLeftAddon, InputRightAddon, NumberInput, NumberInputField, Select, Stack, Switch, Text, Textarea, Wrap, WrapItem } from '@chakra-ui/react'
import Card from '../../components/common/Card'
import SaveBar from './SaveBar'
import { useSection } from './useSection'
import { PAYMENT_PROVIDERS } from '../../lib/enums'
import { humanize } from '../../utils/format'

export function OrderingTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'ordering', 'Ordering', onSaved)
  return (
    <Card title="Ordering">
      <Stack spacing={4}>
        <FormControl maxW="280px">
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
        <FormControl display="flex" alignItems="center" justifyContent="space-between" maxW="420px">
          <Box>
            <FormLabel mb={0}>Rush jobs available</FormLabel>
            <Text fontSize="xs" color="ink.500">
              Lets customers flag a rush; you still quote the fee.
            </Text>
          </Box>
          <Switch isChecked={Boolean(draft.rush_available)} onChange={(e) => set({ rush_available: e.target.checked })} />
        </FormControl>
        <FormControl>
          <FormLabel>Minimum order note</FormLabel>
          <Textarea rows={2} value={draft.min_order_note || ''} onChange={(e) => set({ min_order_note: e.target.value })} placeholder="12-piece minimum per design. Mixed sizes are fine." />
        </FormControl>
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

export function TaxTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'tax', 'Tax', onSaved)
  const pct = draft.rate !== undefined && draft.rate !== '' && draft.rate !== null ? (Number(draft.rate) * 100).toFixed(3).replace(/\.?0+$/, '') : ''
  return (
    <Card title="Sales tax">
      <Stack spacing={4}>
        <FormControl maxW="240px">
          <FormLabel>Tax rate</FormLabel>
          <InputGroup>
            <Input fontFamily="mono" type="number" step="0.001" min={0} max={30} value={pct} onChange={(e) => set({ rate: e.target.value === '' ? 0 : Math.round(Number(e.target.value) * 100000) / 10000000 })} placeholder="0" />
            <InputRightAddon bg="paper2" borderColor="bone.300">
              %
            </InputRightAddon>
          </InputGroup>
          <FormHelperText color="ink.300">
            Stored as a decimal (<Code fontSize="xs">{draft.rate ?? 0}</Code>) and applied server-side when an order is placed.
          </FormHelperText>
        </FormControl>
        <FormControl maxW="320px">
          <FormLabel>Label</FormLabel>
          <Input value={draft.label || ''} onChange={(e) => set({ label: e.target.value })} placeholder="Sales tax" />
        </FormControl>
        <FormControl>
          <FormLabel>Note shown at checkout</FormLabel>
          <Textarea rows={2} value={draft.note || ''} onChange={(e) => set({ note: e.target.value })} placeholder="Tax-exempt organizations: send your certificate and we will remove tax from the invoice." />
        </FormControl>
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

export function ShippingTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'shipping', 'Shipping', onSaved)
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
            <NumberInput value={draft.flat_rate ?? ''} min={0} precision={2} onChange={(v) => set({ flat_rate: v === '' ? 0 : Number(v) })} w="full">
              <NumberInputField fontFamily="mono" borderLeftRadius={0} />
            </NumberInput>
          </InputGroup>
          <FormHelperText color="ink.300">Charged once per order regardless of size.</FormHelperText>
        </FormControl>
        <FormControl>
          <FormLabel>Shipping note</FormLabel>
          <Textarea rows={2} value={draft.note || ''} onChange={(e) => set({ note: e.target.value })} placeholder="Large festival runs ship freight; we will confirm the rate before invoicing." />
        </FormControl>
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

export function PaymentsTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'payments', 'Payments', onSaved)
  const available = Array.isArray(draft.providers_available) ? draft.providers_available : ['invoice']
  const toggle = (p, on) => {
    const next = on ? [...new Set([...available, p])] : available.filter((x) => x !== p)
    const patch = { providers_available: next.length ? next : ['invoice'] }
    if (!patch.providers_available.includes(draft.provider)) patch.provider = patch.providers_available[0]
    set(patch)
  }
  return (
    <Card title="Payments">
      <Stack spacing={4}>
        <FormControl>
          <FormLabel>Providers offered at checkout</FormLabel>
          <Wrap spacing={4}>
            {PAYMENT_PROVIDERS.map((p) => (
              <WrapItem key={p}>
                <Checkbox isChecked={available.includes(p)} onChange={(e) => toggle(p, e.target.checked)}>
                  {humanize(p)}
                </Checkbox>
              </WrapItem>
            ))}
          </Wrap>
          <FormHelperText color="ink.300">Stripe and Square need keys on the storefront's serverless side before they will charge anything.</FormHelperText>
        </FormControl>
        <FormControl maxW="320px">
          <FormLabel>Default provider</FormLabel>
          <Select value={draft.provider || 'invoice'} onChange={(e) => set({ provider: e.target.value })}>
            {available.map((p) => (
              <option key={p} value={p}>
                {p === 'invoice' ? 'Invoice (shop sends invoice after review)' : humanize(p)}
              </option>
            ))}
          </Select>
        </FormControl>
        <FormControl>
          <FormLabel>Note shown at checkout</FormLabel>
          <Textarea rows={3} value={draft.note || ''} onChange={(e) => set({ note: e.target.value })} placeholder="We review every order and send an invoice within one business day. Nothing is charged until you approve the proof." />
        </FormControl>
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

