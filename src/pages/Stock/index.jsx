// src/pages/Stock/index.jsx
//
// The shelf. One row per thing you count, its count in its own unit, the
// par level, and the last time it moved. Two taps to move stock in or out
// from the row. Low stock rows carry an orange dot. Search covers brand,
// style, color, size and design.

import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { Box, Button, HStack, Link, Select, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure } from '@chakra-ui/react'
import { FiPlus, FiArrowDown, FiArrowUp } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import SearchInput from '../../components/common/SearchInput'
import TableSkeleton from '../../components/common/TableSkeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import { listStock } from '../../lib/api/stock'
import MoveDrawer from './MoveDrawer'
import ItemDrawer from './ItemDrawer'
import { timeAgo } from '../../utils/format'

export function unitLabel(n, unit) {
  const v = Number(n) || 0
  const short = unit === 'dozen' ? 'dz' : 'ea'
  return `${Number.isInteger(v) ? v : v.toFixed(1)} ${short}`
}

export default function Stock() {
  const [search, setSearch] = useState('')
  const [kind, setKind] = useState('')
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')
  const move = useDisclosure()
  const edit = useDisclosure()
  const [target, setTarget] = useState(null)
  const [direction, setDirection] = useState('out')

  const load = useCallback(async () => {
    setError('')
    try {
      setRows(await listStock({ search, kind: kind || undefined }))
    } catch (err) {
      setError(err.message)
    }
  }, [search, kind])

  useEffect(() => {
    const t = setTimeout(load, 250)
    return () => clearTimeout(t)
  }, [load])

  const openMove = (item, dir) => { setTarget(item); setDirection(dir); move.onOpen() }
  const openEdit = (item) => { setTarget(item); edit.onOpen() }

  return (
    <MotionFade>
      <PageHeader
        eyebrow="The shelf"
        title="Stock"
        description="What is on hand, counted through a ledger. Every in and out carries initials and a time."
        actions={<Button size="sm" leftIcon={<FiPlus />} onClick={() => openEdit(null)}>New item</Button>}
      />
      <Card p={0}>
        <HStack p={4} spacing={3} borderBottom="1px solid" borderColor="bone.200" flexWrap="wrap">
          <SearchInput value={search} onChange={setSearch} placeholder="Brand, style, color, size, design" maxW="360px" />
          <Select size="sm" maxW="160px" value={kind} onChange={(e) => setKind(e.target.value)} bg="white">
            <option value="">Blanks and printed</option>
            <option value="blank">Blanks</option>
            <option value="printed">Printed</option>
          </Select>
        </HStack>
        {error ? (
          <ErrorState message={error} onRetry={load} />
        ) : !rows ? (
          <TableSkeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState title="Nothing on the shelf yet." description="Add the first item, then move stock in." action={<Button size="sm" onClick={() => openEdit(null)}>New item</Button>} />
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Item</Th>
                  <Th>Color</Th>
                  <Th>Size</Th>
                  <Th isNumeric>On hand</Th>
                  <Th isNumeric>Par</Th>
                  <Th>Last move</Th>
                  <Th />
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((r) => {
                  const low = r.par_level > 0 && r.on_hand < r.par_level
                  return (
                    <Tr key={r.id} _hover={{ bg: 'paper2' }}>
                      <Td>
                        <HStack spacing={2}>
                          {low && <Box w="7px" h="7px" borderRadius="full" bg="ember.500" flexShrink={0} title="Below par" />}
                          <Link as={RouterLink} to={`/stock/${r.id}`} fontWeight={600} color="ink.900">{r.name}</Link>
                        </HStack>
                        <Text fontSize="xs" color="ink.500">{[r.kind === 'printed' ? r.design_name : null, r.brand, r.style_number].filter(Boolean).join(' · ')}</Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {r.color_hex && <Box w="12px" h="12px" borderRadius="full" bg={r.color_hex} border="1px solid" borderColor="bone.200" />}
                          <Text fontSize="sm">{r.color_name || ''}</Text>
                        </HStack>
                      </Td>
                      <Td><Mono>{r.size || ''}</Mono></Td>
                      <Td isNumeric><Mono fontWeight={600} color={low ? 'ember.600' : 'ink.900'}>{unitLabel(r.on_hand, r.unit)}</Mono></Td>
                      <Td isNumeric><Mono color="ink.400">{r.par_level ? unitLabel(r.par_level, r.unit) : ''}</Mono></Td>
                      <Td><Text fontSize="xs" color="ink.500">{r.last_move_at ? timeAgo(r.last_move_at) : 'never'}</Text></Td>
                      <Td isNumeric>
                        <HStack justify="flex-end" spacing={1}>
                          <Button size="xs" variant="outline" leftIcon={<FiArrowDown />} onClick={() => openMove(r, 'in')}>In</Button>
                          <Button size="xs" variant="outline" leftIcon={<FiArrowUp />} onClick={() => openMove(r, 'out')}>Out</Button>
                        </HStack>
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
      <MoveDrawer isOpen={move.isOpen} onClose={move.onClose} item={target} direction={direction} onDone={load} />
      <ItemDrawer isOpen={edit.isOpen} onClose={edit.onClose} item={target} onDone={load} />
    </MotionFade>
  )
}
