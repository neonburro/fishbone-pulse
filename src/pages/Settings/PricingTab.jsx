// src/pages/Settings/PricingTab.jsx
//
// The fees that are not on a product. Screen setup and the per location
// charge live on decoration_options and the storefront prices them server
// side in place_order. Every number here is a placeholder until the shop
// gives us theirs. Product prices and quantity breaks are edited on each
// product.

import { useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Button, FormControl, FormLabel, HStack, Input, InputGroup, InputLeftAddon, NumberInput, NumberInputField, Stack, Switch, Text, useToast } from '@chakra-ui/react'
import Card from '../../components/common/Card'
import SaveBar from './SaveBar'
import { listDecorationOptions, updateDecorationOption } from '../../lib/api/products'
import { useSection } from './useSection'

export default function PricingTab({ settings, onSaved }) {
  const toast = useToast()
  const sizes = useSection(settings, 'pricing', 'Pricing', onSaved)
  const up = sizes.draft.size_upcharges || {}
  const setUp = (k, v) => sizes.set({ size_upcharges: { ...up, [k]: v === '' ? 0 : Number(v) } })
  const [rows, setRows] = useState(null)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const r = await listDecorationOptions()
    setRows(r)
    setDraft(Object.fromEntries(r.map((o) => [o.id, { setup_fee: o.setup_fee, per_location_fee: o.per_location_fee, is_active: o.is_active, name: o.name }])))
  }
  useEffect(() => { load().catch(() => setRows([])) }, [])

  const dirty = rows && rows.some((o) => {
    const d = draft[o.id]
    return d && (Number(d.setup_fee) !== Number(o.setup_fee) || Number(d.per_location_fee) !== Number(o.per_location_fee) || d.is_active !== o.is_active || d.name !== o.name)
  })

  const save = async () => {
    setSaving(true)
    try {
      for (const o of rows) {
        const d = draft[o.id]
        if (!d) continue
        if (Number(d.setup_fee) !== Number(o.setup_fee) || Number(d.per_location_fee) !== Number(o.per_location_fee) || d.is_active !== o.is_active || d.name !== o.name) {
          await updateDecorationOption(o.id, { setup_fee: Number(d.setup_fee) || 0, per_location_fee: Number(d.per_location_fee) || 0, is_active: d.is_active, name: d.name })
        }
      }
      await load()
      toast({ title: 'Pricing saved', status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not save', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const set = (id, patch) => setDraft((d) => ({ ...d, [id]: { ...d[id], ...patch } }))

  return (
    <Stack spacing={5}>
      <Card title="Show prices on the site">
        <HStack justify="space-between" maxW="520px">
          <Text fontSize="sm" color="ink.500">Off, and the storefront says "priced on proof" everywhere a number would be. On, and it shows the numbers below and on each product. Keep it off until the real prices are in.</Text>
          <Switch isChecked={sizes.draft.show_prices !== false} onChange={(e) => sizes.set({ show_prices: e.target.checked })} colorScheme="orange" />
        </HStack>
        <SaveBar onSave={sizes.save} saving={sizes.saving} dirty={sizes.dirty} />
      </Card>
      <Card title="Size upcharges">
        <HStack justify="space-between" maxW="520px" mb={4}>
          <Text fontSize="sm" color="ink.500">Bigger sizes cost more to buy. Turn this on and each piece of a size below adds its upcharge, on the storefront estimate and in the order total.</Text>
          <Switch isChecked={Boolean(sizes.draft.size_upcharges_enabled)} onChange={(e) => sizes.set({ size_upcharges_enabled: e.target.checked })} colorScheme="orange" />
        </HStack>
        <HStack spacing={4} flexWrap="wrap" opacity={sizes.draft.size_upcharges_enabled ? 1 : 0.5}>
          {['2XL', '3XL', '4XL', '5XL'].map((s) => (
            <FormControl key={s} maxW="150px">
              <FormLabel>{s}</FormLabel>
              <InputGroup>
                <InputLeftAddon bg="paper2" borderColor="bone.200">+$</InputLeftAddon>
                <NumberInput value={up[s] ?? ''} min={0} precision={2} step={0.5} onChange={(v) => setUp(s, v)} w="full"><NumberInputField fontFamily="mono" borderLeftRadius={0} placeholder="0" /></NumberInput>
              </InputGroup>
            </FormControl>
          ))}
        </HStack>
        <SaveBar onSave={sizes.save} saving={sizes.saving} dirty={sizes.dirty} />
      </Card>
      <Card title="Setup and locations">
        <Text fontSize="sm" color="ink.500" mb={4}>Charged once per run, not per shirt. Setup covers burning screens. Each extra print location adds a screen. Turn a method off and the storefront stops offering it.</Text>
        <Stack spacing={4}>
          {(rows || []).map((o) => {
            const d = draft[o.id] || {}
            return (
              <HStack key={o.id} spacing={4} align="flex-end" flexWrap="wrap" pb={4} borderBottom="1px solid" borderColor="bone.200">
                <FormControl maxW="220px">
                  <FormLabel>Method</FormLabel>
                  <Input value={d.name || ''} onChange={(e) => set(o.id, { name: e.target.value })} />
                </FormControl>
                <FormControl maxW="170px">
                  <FormLabel>Setup</FormLabel>
                  <InputGroup>
                    <InputLeftAddon bg="paper2" borderColor="bone.200">$</InputLeftAddon>
                    <NumberInput value={d.setup_fee ?? ''} min={0} precision={2} step={5} onChange={(v) => set(o.id, { setup_fee: v })} w="full"><NumberInputField fontFamily="mono" borderLeftRadius={0} /></NumberInput>
                  </InputGroup>
                </FormControl>
                <FormControl maxW="170px">
                  <FormLabel>Per extra location</FormLabel>
                  <InputGroup>
                    <InputLeftAddon bg="paper2" borderColor="bone.200">$</InputLeftAddon>
                    <NumberInput value={d.per_location_fee ?? ''} min={0} precision={2} step={5} onChange={(v) => set(o.id, { per_location_fee: v })} w="full"><NumberInputField fontFamily="mono" borderLeftRadius={0} /></NumberInput>
                  </InputGroup>
                </FormControl>
                <FormControl maxW="140px" pb={2}>
                  <HStack><Switch isChecked={Boolean(d.is_active)} onChange={(e) => set(o.id, { is_active: e.target.checked })} colorScheme="orange" /><Text fontSize="sm">{d.is_active ? 'Offered' : 'Off'}</Text></HStack>
                </FormControl>
              </HStack>
            )
          })}
        </Stack>
        <SaveBar onSave={save} saving={saving} dirty={Boolean(dirty)} />
      </Card>
      <Card title="Garment prices and quantity breaks">
        <Text fontSize="sm" color="ink.500">Each product carries its own base price and its own breaks (24, 48, 72, 144 today). Edit them on the product.</Text>
        <Text fontSize="xs" color="ink.300" mt={1}>Every price on the site is a placeholder until the shop gives us real numbers.</Text>
        <Button as={RouterLink} to="/products" size="sm" variant="outline" mt={4}>Open products</Button>
      </Card>
    </Stack>
  )
}
