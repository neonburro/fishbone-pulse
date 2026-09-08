// src/pages/Stock/ItemDrawer.jsx
//
// New or edit a stock item. A blank is brand, style, color and size. A
// printed shirt is a design on a blank. Unit is each or dozen and it is per
// item. Par is the count that should be on the shelf, below it the row
// goes orange. A sell price makes it something the rack can sell, and
// "random" marks it as off the pile, no returns.

import { useEffect, useMemo, useState } from 'react'
import { Box, Button, Checkbox, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormHelperText, FormLabel, HStack, Input, NumberInput, NumberInputField, Select, Stack, Text, Textarea, useToast } from '@chakra-ui/react'
import { createStockItem, updateStockItem, addStockMove } from '../../lib/api/stock'
import { listProducts } from '../../lib/api/products'
import { listBlankColors, ensureVariant } from '../../lib/api/colors'
import { ColorPicker } from '../../components/runs/ItemDrawer'
import { rememberedInitials } from '../../components/common/InitialsDialog'

const EMPTY = { kind: 'blank', name: '', brand: '', style_number: '', color_name: '', color_hex: '', size: '', design_name: '', product_id: '', unit: 'each', par_level: '', location: '', sell_price: '', is_random: false, notes: '', opening: '', initials: '' }
const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL', 'OS']

export default function ItemDrawer({ isOpen, onClose, item, onDone }) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState([])
  const [colors, setColors] = useState([])
  useEffect(() => {
    if (!isOpen) return
    setForm(item ? { ...EMPTY, ...item, product_id: item.product_id || '', par_level: item.par_level ?? '', sell_price: item.sell_price ?? '', initials: rememberedInitials() } : { ...EMPTY, initials: rememberedInitials() })
    listProducts({ active: 'active', pageSize: 100 }).then((r) => setProducts(r.rows || [])).catch(() => setProducts([]))
  }, [isOpen, item])
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))
  const product = useMemo(() => products.find((p) => p.id === form.product_id), [products, form.product_id])
  useEffect(() => {
    const brand = product?.brand || form.brand, style = product?.style_number || form.style_number
    if (!brand || !style) { setColors([]); return }
    listBlankColors({ brand, style_number: style }).then(setColors).catch(() => setColors([]))
  }, [product, form.brand, form.style_number])
  const pickProduct = (id) => { const p = products.find((x) => x.id === id); set(p ? { product_id: id, brand: p.brand || form.brand, style_number: p.style_number || form.style_number } : { product_id: '' }) }

  const submit = async () => {
    setSaving(true)
    try {
      // A blank tied to a catalog product becomes a color on the storefront.
      let variant_id = form.variant_id || null
      if (form.kind === 'blank' && form.product_id && form.color_name.trim()) {
        try { variant_id = await ensureVariant(form.product_id, { color_name: form.color_name.trim(), color_hex: form.color_hex.trim() || null }) } catch (err) { toast({ title: 'Saved, but the storefront color did not link', description: err.message, status: 'warning' }) }
      }
      const payload = { ...form, product_id: form.product_id || null, variant_id }
      let saved
      if (item?.id) saved = await updateStockItem(item.id, payload)
      else saved = await createStockItem(payload)
      const opening = Number(form.opening)
      if (!item?.id && opening > 0) {
        await addStockMove(saved.id, { quantity: opening, unit: form.unit, direction: 'in', reason: 'received', initials: form.initials, note: 'Opening count' })
        try { localStorage.setItem('fb-initials', form.initials.toUpperCase()) } catch { /* fine */ }
      }
      toast({ title: item?.id ? 'Item saved' : opening > 0 ? `On the shelf, ${opening} ${form.unit}` : 'Item added', status: 'success', duration: 1500 })
      onDone?.()
      onClose()
    } catch (err) {
      toast({ title: 'Not saved', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent bg="paper">
        <DrawerCloseButton />
        <DrawerHeader>
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">{item?.id ? 'Edit item' : 'New item'}</Text>
          <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" lineHeight={1} mt={1}>{form.name || 'On the shelf'}</Text>
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>
            <FormControl>
              <FormLabel>Kind</FormLabel>
              <Select value={form.kind} onChange={(e) => set({ kind: e.target.value })} bg="white">
                <option value="blank">Blank garment</option>
                <option value="printed">Printed shirt</option>
              </Select>
            </FormControl>
            {form.kind === 'printed' && (
              <FormControl>
                <FormLabel>Design</FormLabel>
                <Input value={form.design_name} onChange={(e) => set({ design_name: e.target.value })} placeholder="Telluride Bluegrass 45" />
              </FormControl>
            )}
            {form.kind === 'blank' && (
              <FormControl>
                <FormLabel>Catalog blank</FormLabel>
                <Select value={form.product_id} onChange={(e) => pickProduct(e.target.value)} bg="white" placeholder="Not on the storefront">
                  {products.map((p) => <option key={p.id} value={p.id}>{[p.brand, p.style_number, p.name].filter(Boolean).join(' · ')}</option>)}
                </Select>
                <FormHelperText color="ink.300">Pick one and this color shows up on the storefront under that blank.</FormHelperText>
              </FormControl>
            )}
            <HStack spacing={3}>
              <FormControl><FormLabel>Brand</FormLabel><Input value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Comfort Colors" /></FormControl>
              <FormControl maxW="160px"><FormLabel>Style</FormLabel><Input value={form.style_number} onChange={(e) => set({ style_number: e.target.value })} fontFamily="mono" placeholder="1717" /></FormControl>
            </HStack>
            {colors.length > 0 && (
              <FormControl>
                <FormLabel>Catalog colors</FormLabel>
                <ColorPicker colors={colors} value={form.color_name} hex={form.color_hex} onPick={(c) => set({ color_name: c.color_name, color_hex: c.color_hex || '' })} />
              </FormControl>
            )}
            <HStack spacing={3}>
              <FormControl><FormLabel>Color</FormLabel><Input value={form.color_name} onChange={(e) => set({ color_name: e.target.value })} placeholder="Pepper" /></FormControl>
              <FormControl maxW="150px">
                <FormLabel>Hex</FormLabel>
                <HStack spacing={1}>
                  <Box as="label" w="34px" h="34px" flexShrink={0} borderRadius="8px" bg={form.color_hex || 'bone.200'} border="1px solid" borderColor="bone.300" cursor="pointer" overflow="hidden" position="relative">
                    <Input type="color" value={/^#[0-9a-f]{6}$/i.test(form.color_hex) ? form.color_hex : '#888888'} onChange={(e) => set({ color_hex: e.target.value.toUpperCase() })} position="absolute" inset={0} opacity={0} w="100%" h="100%" p={0} cursor="pointer" />
                  </Box>
                  <Input value={form.color_hex} onChange={(e) => set({ color_hex: e.target.value })} fontFamily="mono" placeholder="#4E4C4A" />
                </HStack>
              </FormControl>
              <FormControl maxW="110px">
                <FormLabel>Size</FormLabel>
                <Input value={form.size} onChange={(e) => set({ size: e.target.value.toUpperCase() })} fontFamily="mono" placeholder="L" list="fb-sizes" />
                <datalist id="fb-sizes">{SIZES.map((s) => <option key={s} value={s} />)}</datalist>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Leave blank to build it from brand, style, color and size" />
            </FormControl>
            <HStack spacing={3} align="flex-end">
              <FormControl maxW="140px">
                <FormLabel>Counted in</FormLabel>
                <Select value={form.unit} onChange={(e) => set({ unit: e.target.value })} bg="white">
                  <option value="each">each</option>
                  <option value="dozen">dozen</option>
                </Select>
              </FormControl>
              <FormControl maxW="140px">
                <FormLabel>Par level</FormLabel>
                <NumberInput value={form.par_level} min={0} onChange={(v) => set({ par_level: v })}><NumberInputField fontFamily="mono" /></NumberInput>
              </FormControl>
              <FormControl><FormLabel>Where</FormLabel><Input value={form.location} onChange={(e) => set({ location: e.target.value })} placeholder="Back wall, shelf 3" /></FormControl>
            </HStack>
            <HStack spacing={3} align="flex-end">
              <FormControl maxW="160px">
                <FormLabel>Sell price</FormLabel>
                <NumberInput value={form.sell_price} min={0} precision={2} step={1} onChange={(v) => set({ sell_price: v })}><NumberInputField fontFamily="mono" placeholder="—" /></NumberInput>
                <FormHelperText color="ink.300">Set one and it can sell on the rack.</FormHelperText>
              </FormControl>
              <FormControl pb={6}>
                <Checkbox isChecked={form.is_random} onChange={(e) => set({ is_random: e.target.checked })} colorScheme="orange">Off the pile. Random sizes, no returns.</Checkbox>
              </FormControl>
            </HStack>
            {!item?.id && (
              <HStack spacing={3} align="flex-end">
                <FormControl maxW="160px">
                  <FormLabel>On the shelf now</FormLabel>
                  <NumberInput value={form.opening} min={0} onChange={(v) => set({ opening: v })}><NumberInputField fontFamily="mono" placeholder="0" /></NumberInput>
                  <FormHelperText color="ink.300">Counted in {form.unit}. Goes in the ledger.</FormHelperText>
                </FormControl>
                <FormControl maxW="120px" pb={6} isRequired={Number(form.opening) > 0}>
                  <FormLabel>Initials</FormLabel>
                  <Input value={form.initials} onChange={(e) => set({ initials: e.target.value.toUpperCase().slice(0, 4) })} fontFamily="mono" placeholder="JR" />
                </FormControl>
              </HStack>
            )}
            <FormControl>
              <FormLabel>Notes</FormLabel>
              <Textarea rows={2} value={form.notes || ''} onChange={(e) => set({ notes: e.target.value })} />
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button onClick={submit} isLoading={saving}>{item?.id ? 'Save' : 'Add to the shelf'}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
