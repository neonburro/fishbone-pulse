// src/components/runs/ItemDrawer.jsx
//
// One line on the run. Pick a blank, pick a color from the catalog swatches
// (or type one), where the ink goes, how many, the unit price, the sizes.
// The line total is unit times quantity and the run's totals are redone on
// the server when it saves.

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormLabel, HStack, Input, NumberInput, NumberInputField, Select, SimpleGrid, Stack, Text, Textarea, Wrap, WrapItem, useToast } from '@chakra-ui/react'
import { listProducts } from '../../lib/api/products'
import { listBlankColors } from '../../lib/api/colors'
import { saveItem } from '../../lib/api/orders'
import { formatMoney } from '../../utils/money'

const PLACES = ['front', 'back', 'left_chest', 'hood', 'other']
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']
const EMPTY = { product_id: '', product_name: '', variant_label: '', color_hex: '', quantity: '', unit_price: '', print_locations: ['front'], size_breakdown: {}, notes: '' }

export function ColorPicker({ colors = [], value, hex, onPick }) {
  return (
    <Wrap spacing={2}>
      {colors.map((c) => {
        const on = value && value.toLowerCase() === c.color_name.toLowerCase()
        return (
          <WrapItem key={c.id}>
            <Box as="button" type="button" onClick={() => onPick(c)} title={c.color_name} w="30px" h="22px" borderRadius="6px" bg={c.color_hex || 'bone.200'} border="2px solid" borderColor={on ? 'ember.500' : 'transparent'} boxShadow={on ? '0 0 0 1px #FF6A13' : '0 0 0 1px rgba(22,22,24,0.12) inset'} />
          </WrapItem>
        )
      })}
      {value && <WrapItem><HStack spacing={2} pl={1}><Box w="14px" h="14px" borderRadius="4px" bg={hex || 'bone.200'} border="1px solid" borderColor="bone.300" /><Text fontSize="sm">{value}</Text></HStack></WrapItem>}
    </Wrap>
  )
}

export default function ItemDrawer({ isOpen, onClose, orderId, item, onSaved }) {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [colors, setColors] = useState([])
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    if (!isOpen) return
    setForm(item ? { ...EMPTY, ...item, quantity: item.quantity ?? '', unit_price: item.unit_price ?? '', size_breakdown: item.size_breakdown || {}, print_locations: item.print_locations || ['front'] } : EMPTY)
    listProducts({ active: 'active', pageSize: 100 }).then((r) => setProducts(r.rows || [])).catch(() => setProducts([]))
  }, [isOpen, item])

  const product = useMemo(() => products.find((p) => p.id === form.product_id), [products, form.product_id])
  useEffect(() => {
    if (!product) { setColors([]); return }
    listBlankColors({ brand: product.brand, style_number: product.style_number }).then(setColors).catch(() => setColors([]))
  }, [product])

  const sizeTotal = Object.values(form.size_breakdown || {}).reduce((s, n) => s + (Number(n) || 0), 0)
  const qty = Number(form.quantity) || 0
  const line = (Number(form.unit_price) || 0) * qty

  const pickProduct = (id) => { const p = products.find((x) => x.id === id); set({ product_id: id, product_name: p ? p.name : form.product_name, variant_label: '', color_hex: '' }) }
  const toggle = (k) => set({ print_locations: form.print_locations.includes(k) ? form.print_locations.filter((x) => x !== k) : [...form.print_locations, k] })
  const setSize = (s, v) => set({ size_breakdown: { ...form.size_breakdown, [s]: v === '' ? 0 : Math.max(0, Math.round(Number(v) || 0)) } })
  const spread = () => {
    if (!qty) return
    const per = Math.floor(qty / SIZES.slice(1, 6).length); let rem = qty - per * 5
    const next = {}; for (const s of SIZES.slice(1, 6)) { next[s] = per + (rem > 0 ? 1 : 0); if (rem > 0) rem -= 1 }
    set({ size_breakdown: next })
  }

  const submit = async () => {
    if (!form.product_name.trim()) return toast({ title: 'Pick a blank or name the garment', status: 'warning' })
    if (!qty) return toast({ title: 'How many?', status: 'warning' })
    setBusy(true)
    try {
      const r = await saveItem(orderId, { ...form, id: item?.id, sku: product?.style_number ? `${product.style_number}-${(form.variant_label || '').replace(/\W+/g, '').toUpperCase()}` : null })
      onSaved?.(r)
      onClose()
    } catch (err) { toast({ title: 'Not saved', description: err.message, status: 'error' }) } finally { setBusy(false) }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent bg="paper">
        <DrawerCloseButton />
        <DrawerHeader>
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">{item ? 'Edit line' : 'Add a line'}</Text>
          <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" lineHeight={1} mt={1}>{form.product_name || 'The garment'}</Text>
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Blank</FormLabel>
              <Select value={form.product_id} onChange={(e) => pickProduct(e.target.value)} bg="white" placeholder="Pick from the catalog">
                {products.map((p) => <option key={p.id} value={p.id}>{[p.brand, p.style_number, p.name].filter(Boolean).join(' · ')}</option>)}
              </Select>
            </FormControl>
            <FormControl><FormLabel>Or name it</FormLabel><Input value={form.product_name} onChange={(e) => set({ product_name: e.target.value })} placeholder="Customer supplied hoodies" bg="white" /></FormControl>
            <FormControl>
              <FormLabel>Color</FormLabel>
              {colors.length > 0 && <Box mb={2}><ColorPicker colors={colors} value={form.variant_label} hex={form.color_hex} onPick={(c) => set({ variant_label: c.color_name, color_hex: c.color_hex || '' })} /></Box>}
              <HStack spacing={2}>
                <Input value={form.variant_label} onChange={(e) => set({ variant_label: e.target.value })} placeholder="Pepper, or the Pantone they gave you" bg="white" />
                <Input value={form.color_hex} onChange={(e) => set({ color_hex: e.target.value })} placeholder="#hex" fontFamily="mono" maxW="120px" bg="white" />
              </HStack>
            </FormControl>
            <FormControl>
              <FormLabel>Where the ink goes</FormLabel>
              <Wrap spacing={2}>
                {PLACES.map((k) => { const on = form.print_locations.includes(k); return <WrapItem key={k}><Button size="xs" variant={on ? 'solid' : 'outline'} onClick={() => toggle(k)} textTransform="uppercase">{k.replace('_', ' ')}</Button></WrapItem> })}
              </Wrap>
            </FormControl>
            <HStack spacing={3} align="flex-end">
              <FormControl maxW="140px" isRequired><FormLabel>Quantity</FormLabel><NumberInput value={form.quantity} min={0} onChange={(v) => set({ quantity: v })}><NumberInputField fontFamily="mono" bg="white" /></NumberInput></FormControl>
              <FormControl maxW="160px"><FormLabel>Unit price</FormLabel><NumberInput value={form.unit_price} min={0} precision={2} step={0.5} onChange={(v) => set({ unit_price: v })}><NumberInputField fontFamily="mono" bg="white" /></NumberInput></FormControl>
              <Box pb={2}><Text fontFamily="mono" fontSize="11px" letterSpacing="0.14em" textTransform="uppercase" color="ink.500">Line</Text><Text fontFamily="mono" fontWeight={600}>{formatMoney(line)}</Text></Box>
            </HStack>
            <FormControl>
              <HStack justify="space-between" mb={1}><FormLabel mb={0}>Sizes</FormLabel><HStack spacing={3}><Text fontFamily="mono" fontSize="11px" color={qty && sizeTotal !== qty ? 'ember.600' : 'ink.500'}>{sizeTotal} of {qty}</Text><Button size="xs" variant="ghost" onClick={spread}>Spread evenly</Button></HStack></HStack>
              <SimpleGrid columns={8} spacing={1.5}>
                {SIZES.map((s) => (
                  <Box key={s}>
                    <Text fontFamily="mono" fontSize="10px" textAlign="center" color="ink.500" mb={0.5}>{s}</Text>
                    <Input value={form.size_breakdown?.[s] ?? ''} onChange={(e) => setSize(s, e.target.value)} textAlign="center" fontFamily="mono" size="sm" bg="white" px={1} />
                  </Box>
                ))}
              </SimpleGrid>
            </FormControl>
            <FormControl><FormLabel>Note on this line</FormLabel><Textarea rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Discharge white underbase. Match the 2025 Seafoam." bg="white" /></FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button onClick={submit} isLoading={busy}>{item ? 'Save line' : 'Add to the run'}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
