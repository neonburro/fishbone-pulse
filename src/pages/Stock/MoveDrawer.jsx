// src/pages/Stock/MoveDrawer.jsx
//
// Two taps to move stock. Quantity, each or dozen, why, and your initials.
// Initials are required, the ledger is only worth something if every line
// has a name on it.

import { useEffect, useState } from 'react'
import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormHelperText, FormLabel, HStack, Input, NumberInput, NumberInputField, Select, Stack, Text, Textarea, useToast } from '@chakra-ui/react'
import { addStockMove, STOCK_REASONS } from '../../lib/api/stock'
import { unitLabel } from './index'

const DEFAULT_REASON = { in: 'received', out: 'pulled_for_run' }

export default function MoveDrawer({ isOpen, onClose, item, direction = 'out', onDone }) {
  const toast = useToast()
  const [form, setForm] = useState({ quantity: '', unit: 'each', reason: 'received', initials: '', note: '' })
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    if (isOpen && item) {
      const remembered = (typeof localStorage !== 'undefined' && localStorage.getItem('fb-initials')) || ''
      setForm({ quantity: '', unit: item.unit || 'each', reason: DEFAULT_REASON[direction], initials: remembered, note: '' })
    }
  }, [isOpen, item, direction])
  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const submit = async () => {
    if (!item) return
    setSaving(true)
    try {
      await addStockMove(item.id, { ...form, direction })
      try { localStorage.setItem('fb-initials', form.initials.trim().toUpperCase()) } catch { /* fine */ }
      toast({ title: `${direction === 'in' ? 'In' : 'Out'}: ${unitLabel(form.quantity, form.unit)} ${item.name}`, status: 'success', duration: 1800 })
      onDone?.()
      onClose()
    } catch (err) {
      toast({ title: 'Not saved', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm">
      <DrawerOverlay />
      <DrawerContent bg="paper">
        <DrawerCloseButton />
        <DrawerHeader>
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">{direction === 'in' ? 'Stock in' : 'Stock out'}</Text>
          <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" lineHeight={1} mt={1}>{item?.name}</Text>
          {item && <Text fontSize="xs" color="ink.500" mt={1}>On hand now: {unitLabel(item.on_hand, item.unit)}</Text>}
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>
            <HStack align="flex-end" spacing={3}>
              <FormControl isRequired>
                <FormLabel>Quantity</FormLabel>
                <NumberInput value={form.quantity} min={0} precision={2} step={1} onChange={(v) => set({ quantity: v })}>
                  <NumberInputField fontFamily="mono" autoFocus />
                </NumberInput>
              </FormControl>
              <FormControl maxW="140px">
                <FormLabel>Unit</FormLabel>
                <Select value={form.unit} onChange={(e) => set({ unit: e.target.value })} bg="white">
                  <option value="each">each</option>
                  <option value="dozen">dozen</option>
                </Select>
              </FormControl>
            </HStack>
            <FormControl>
              <FormLabel>Why</FormLabel>
              <Select value={form.reason} onChange={(e) => set({ reason: e.target.value })} bg="white">
                {Object.entries(STOCK_REASONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </FormControl>
            <FormControl isRequired maxW="160px">
              <FormLabel>Your initials</FormLabel>
              <Input value={form.initials} onChange={(e) => set({ initials: e.target.value.toUpperCase().slice(0, 4) })} fontFamily="mono" textTransform="uppercase" placeholder="JR" />
              <FormHelperText color="ink.300">Goes on the ledger with the time.</FormHelperText>
            </FormControl>
            <FormControl>
              <FormLabel>Note</FormLabel>
              <Textarea rows={2} value={form.note} onChange={(e) => set({ note: e.target.value })} placeholder="Run FB-26-01004, or where it went." />
            </FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button onClick={submit} isLoading={saving}>{direction === 'in' ? 'Put it in' : 'Take it out'}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
