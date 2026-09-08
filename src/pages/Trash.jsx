// src/pages/Trash.jsx
//
// What was sent to the trash, who sent it and when. Anything here can come
// back with one tap. Delete forever is a second decision, with initials,
// and it takes the rows you ticked or all of them.

import { useCallback, useEffect, useState } from 'react'
import { Box, Button, Checkbox, HStack, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure, useToast } from '@chakra-ui/react'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import MotionFade from '../components/common/MotionFade'
import Mono from '../components/common/Mono'
import InitialsDialog from '../components/common/InitialsDialog'
import { listTrashedOrders, restoreOrder, purgeOrders } from '../lib/api/orders'
import { listTrashedRequests, restoreRequest, purgeRequests } from '../lib/api/quotes'
import { formatDateTime } from '../utils/format'
import { formatMoney } from '../utils/money'

export default function Trash() {
  const toast = useToast()
  const [orders, setOrders] = useState([])
  const [requests, setRequests] = useState([])
  const [picked, setPicked] = useState(new Set())
  const purge = useDisclosure()

  const load = useCallback(async () => {
    const [o, r] = await Promise.all([listTrashedOrders(), listTrashedRequests()])
    setOrders(o); setRequests(r); setPicked(new Set())
  }, [])
  useEffect(() => { load().catch(() => {}) }, [load])

  const all = [...orders.map((o) => ({ kind: 'order', ...o })), ...requests.map((r) => ({ kind: 'request', ...r }))]
  const toggle = (k) => setPicked((p) => { const n = new Set(p); n.has(k) ? n.delete(k) : n.add(k); return n })
  const key = (row) => `${row.kind}:${row.id}`
  const allPicked = all.length > 0 && all.every((r) => picked.has(key(r)))

  const restore = async (row) => {
    try { if (row.kind === 'order') await restoreOrder(row.id); else await restoreRequest(row.id); toast({ title: 'Back on the board', status: 'success', duration: 1500 }); await load() }
    catch (err) { toast({ title: 'Could not restore', description: err.message, status: 'error' }) }
  }
  const doPurge = async () => {
    const rows = all.filter((r) => picked.has(key(r)))
    await purgeOrders(rows.filter((r) => r.kind === 'order').map((r) => r.id))
    await purgeRequests(rows.filter((r) => r.kind === 'request').map((r) => r.id))
    toast({ title: `${rows.length} gone for good`, status: 'success', duration: 1800 })
    await load()
  }

  return (
    <MotionFade>
      <PageHeader eyebrow="Backstage" title="Trash" description="Sent here with initials. Bring it back, or delete it forever." actions={<Button size="sm" variant="outline" onClick={purge.onOpen} isDisabled={picked.size === 0} borderColor="red.300" color="red.700">Delete forever ({picked.size})</Button>} />
      <Card p={0}>
        {all.length === 0 ? (
          <Text p={5} fontSize="sm" color="ink.500">Nothing in the trash.</Text>
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th w="32px"><Checkbox isChecked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(all.map(key)))} colorScheme="orange" /></Th>
                  <Th>What</Th><Th>Who</Th><Th>Trashed</Th><Th>By</Th><Th />
                </Tr>
              </Thead>
              <Tbody>
                {all.map((row) => (
                  <Tr key={key(row)} _hover={{ bg: 'paper2' }}>
                    <Td><Checkbox isChecked={picked.has(key(row))} onChange={() => toggle(key(row))} colorScheme="orange" /></Td>
                    <Td>
                      <Text fontWeight={600} fontSize="sm">{row.kind === 'order' ? `Run ${row.order_number}` : `Request · ${row.event_name || row.request_type}`}</Text>
                      <Text fontSize="xs" color="ink.500">{row.kind === 'order' ? formatMoney(row.total) : row.company || row.email}</Text>
                    </Td>
                    <Td><Text fontSize="sm">{row.kind === 'order' ? row.contact?.name : row.name}</Text></Td>
                    <Td><Text fontSize="xs" color="ink.500">{formatDateTime(row.deleted_at)}</Text></Td>
                    <Td><Mono>{row.deleted_by}</Mono></Td>
                    <Td isNumeric><Button size="xs" variant="outline" onClick={() => restore(row)}>Bring back</Button></Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
      <InitialsDialog isOpen={purge.isOpen} onClose={purge.onClose} onConfirm={doPurge} title="Delete forever" body={`${picked.size} ${picked.size === 1 ? 'row' : 'rows'} will be gone. There is no bringing them back after this.`} confirmLabel="Delete forever" danger />
    </MotionFade>
  )
}
