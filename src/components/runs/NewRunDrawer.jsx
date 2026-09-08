// src/components/runs/NewRunDrawer.jsx
//
// The plus button. A new customer and a new run in one short form: who,
// how to reach them, when they need it, what they said. It opens the run
// in review and lands you on it, where the garments and the numbers go.

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, FormControl, FormLabel, HStack, Input, Select, Stack, Text, Textarea, useToast } from '@chakra-ui/react'
import { createRun } from '../../lib/api/orders'

const EMPTY = { name: '', email: '', phone: '', company: '', needed_by: '', fulfillment: 'pickup', notes: '' }

export default function NewRunDrawer({ isOpen, onClose }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  useEffect(() => { if (isOpen) setForm(EMPTY) }, [isOpen])
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async () => {
    if (form.name.trim().length < 2) return toast({ title: 'Who is it for?', status: 'warning' })
    setBusy(true)
    try {
      const r = await createRun({ contact: { name: form.name.trim(), email: form.email.trim().toLowerCase() || null, phone: form.phone.trim() || null, company: form.company.trim() || null }, needed_by: form.needed_by || null, notes: form.notes.trim() || null, fulfillment: form.fulfillment })
      onClose()
      toast({ title: `${r.order_number} opened`, status: 'success', duration: 1800 })
      navigate(`/orders/${r.order_id}`)
    } catch (err) {
      toast({ title: 'Could not open the run', description: err.message, status: 'error' })
    } finally { setBusy(false) }
  }

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="md">
      <DrawerOverlay />
      <DrawerContent bg="paper">
        <DrawerCloseButton />
        <DrawerHeader>
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">New run</Text>
          <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" lineHeight={1} mt={1}>Who is it for</Text>
          <Text fontSize="xs" color="ink.500" mt={1}>Garments and the numbers come next, on the run.</Text>
        </DrawerHeader>
        <DrawerBody>
          <Stack spacing={4}>
            <HStack spacing={3} align="flex-start">
              <FormControl isRequired><FormLabel>Name</FormLabel><Input value={form.name} onChange={set('name')} placeholder="Dana Whitcomb" bg="white" autoFocus /></FormControl>
              <FormControl><FormLabel>Band, org or business</FormLabel><Input value={form.company} onChange={set('company')} placeholder="Telluride Bluegrass" bg="white" /></FormControl>
            </HStack>
            <HStack spacing={3} align="flex-start">
              <FormControl><FormLabel>Email</FormLabel><Input type="email" value={form.email} onChange={set('email')} placeholder="dana@example.com" bg="white" /></FormControl>
              <FormControl maxW="200px"><FormLabel>Phone</FormLabel><Input type="tel" value={form.phone} onChange={set('phone')} placeholder="(970) 555-0100" bg="white" /></FormControl>
            </HStack>
            <HStack spacing={3} align="flex-start">
              <FormControl maxW="200px"><FormLabel>Needed by</FormLabel><Input type="date" value={form.needed_by} onChange={set('needed_by')} fontFamily="mono" bg="white" /></FormControl>
              <FormControl maxW="200px"><FormLabel>Pickup or ship</FormLabel><Select value={form.fulfillment} onChange={set('fulfillment')} bg="white"><option value="pickup">Pickup at the shop</option><option value="ship">Ship</option></Select></FormControl>
            </HStack>
            <FormControl><FormLabel>What they want</FormLabel><Textarea rows={4} value={form.notes} onChange={set('notes')} placeholder="48 tees, two color front, needs them before the festival. Art is coming by email." bg="white" /></FormControl>
          </Stack>
        </DrawerBody>
        <DrawerFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>Cancel</Button>
          <Button onClick={submit} isLoading={busy}>Open the run</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
