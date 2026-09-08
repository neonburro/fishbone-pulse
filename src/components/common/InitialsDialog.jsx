// src/components/common/InitialsDialog.jsx
//
// Two letters and it is done. Used for anything that should have a name on
// it: sending a run to the trash, deleting it for good, pulling stock. The
// initials are remembered in this browser so the second time is one tap.

import { useEffect, useRef, useState } from 'react'
import { AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Button, FormControl, FormLabel, Input, Text } from '@chakra-ui/react'

export function rememberedInitials() {
  try { return localStorage.getItem('fb-initials') || '' } catch { return '' }
}

export default function InitialsDialog({ isOpen, onClose, onConfirm, title = 'Sign it off', body, confirmLabel = 'Do it', danger = false, needInitials = true }) {
  const [initials, setInitials] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const ref = useRef(null)
  useEffect(() => { if (isOpen) { setInitials(rememberedInitials()); setErr(''); setBusy(false) } }, [isOpen])
  const go = async () => {
    const ini = initials.trim().toUpperCase()
    if (needInitials && ini.length < 2) { setErr('Two letters at least.'); return }
    setBusy(true)
    try {
      await onConfirm(ini)
      try { localStorage.setItem('fb-initials', ini) } catch { /* fine */ }
      onClose()
    } catch (e) { setErr(e.message || 'Not saved') } finally { setBusy(false) }
  }
  return (
    <AlertDialog isOpen={isOpen} onClose={onClose} leastDestructiveRef={ref} isCentered>
      <AlertDialogOverlay />
      <AlertDialogContent bg="paper" borderRadius="lg" mx={4}>
        <AlertDialogHeader fontFamily="heading" fontWeight={600} textTransform="uppercase" pb={1}>{title}</AlertDialogHeader>
        <AlertDialogBody>
          {body && <Text fontSize="sm" color="ink.500" mb={4}>{body}</Text>}
          {needInitials && (
            <FormControl maxW="160px">
              <FormLabel>Your initials</FormLabel>
              <Input value={initials} onChange={(e) => setInitials(e.target.value.toUpperCase().slice(0, 4))} fontFamily="mono" autoFocus placeholder="JR" bg="white" onKeyDown={(e) => e.key === 'Enter' && go()} />
            </FormControl>
          )}
          {err && <Text fontSize="sm" color="red.600" mt={3}>{err}</Text>}
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={ref} variant="ghost" onClick={onClose} mr={2}>Not yet</Button>
          <Button onClick={go} isLoading={busy} colorScheme={danger ? 'red' : 'ember'} bg={danger ? 'red.600' : undefined} color={danger ? 'white' : undefined} _hover={danger ? { bg: 'red.700' } : undefined}>{confirmLabel}</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
