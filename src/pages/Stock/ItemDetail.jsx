// src/pages/Stock/ItemDetail.jsx
//
// One item and its ledger. The count at the top is the sum of every line
// below it. Every line has initials and a time, and the reason it moved.

import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { Box, Button, Grid, GridItem, HStack, Stack, Table, Tbody, Td, Text, Th, Thead, Tr, useDisclosure } from '@chakra-ui/react'
import { FiArrowDown, FiArrowUp, FiEdit2, FiArrowLeft } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import { getStockItem, STOCK_REASONS } from '../../lib/api/stock'
import { formatDate } from '../../utils/format'
import MoveDrawer from './MoveDrawer'
import ItemDrawer from './ItemDrawer'
import { unitLabel } from './index'

export default function StockItem() {
  const { id } = useParams()
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')
  const move = useDisclosure()
  const edit = useDisclosure()
  const [direction, setDirection] = useState('out')

  const load = useCallback(async () => {
    setError('')
    try { setItem(await getStockItem(id)) } catch (err) { setError(err.message) }
  }, [id])
  useEffect(() => { load() }, [load])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!item) return null
  const low = item.par_level > 0 && item.on_hand < item.par_level

  return (
    <MotionFade>
      <Button as={RouterLink} to="/stock" variant="link" size="sm" leftIcon={<FiArrowLeft />} mb={3} color="ink.500">The shelf</Button>
      <PageHeader
        eyebrow={item.kind === 'printed' ? 'Printed' : 'Blank'}
        title={item.name}
        description={[item.brand, item.style_number, item.color_name, item.size, item.location].filter(Boolean).join(' · ')}
        actions={
          <>
            <Button size="sm" variant="outline" leftIcon={<FiEdit2 />} onClick={edit.onOpen}>Edit</Button>
            <Button size="sm" variant="outline" leftIcon={<FiArrowDown />} onClick={() => { setDirection('in'); move.onOpen() }}>In</Button>
            <Button size="sm" leftIcon={<FiArrowUp />} onClick={() => { setDirection('out'); move.onOpen() }}>Out</Button>
          </>
        }
      />
      <Grid templateColumns={{ base: '1fr', md: '280px 1fr' }} gap={5} alignItems="start">
        <GridItem>
          <Card>
            <Text fontFamily="mono" fontSize="11px" letterSpacing="0.14em" textTransform="uppercase" color="ink.500">On hand</Text>
            <Text fontFamily="heading" fontWeight={700} fontSize="3.2rem" lineHeight={1} mt={2} color={low ? 'ember.600' : 'ink.900'}>{unitLabel(item.on_hand, item.unit)}</Text>
            <Stack spacing={1} mt={4} fontSize="sm" color="ink.500">
              {item.par_level > 0 && <Text>Par {unitLabel(item.par_level, item.unit)}{low ? '. Below par.' : ''}</Text>}
              {item.color_hex && <HStack spacing={2}><Box w="12px" h="12px" borderRadius="full" bg={item.color_hex} border="1px solid" borderColor="bone.200" /><Mono>{item.color_hex}</Mono></HStack>}
              {item.sell_price != null && <Text>Sells for <Mono>${Number(item.sell_price).toFixed(2)}</Mono>{item.is_random ? ', off the pile' : ''}</Text>}
              {item.notes && <Text pt={2}>{item.notes}</Text>}
            </Stack>
          </Card>
        </GridItem>
        <GridItem>
          <Card title="Ledger" p={0}>
            {item.moves.length === 0 ? (
              <Text p={5} fontSize="sm" color="ink.500">No moves yet. Put something in.</Text>
            ) : (
              <Table size="sm">
                <Thead><Tr><Th>When</Th><Th>Move</Th><Th>Why</Th><Th>Who</Th><Th>Note</Th></Tr></Thead>
                <Tbody>
                  {item.moves.map((m) => (
                    <Tr key={m.id}>
                      <Td><Text fontSize="xs" color="ink.500">{formatDate(m.created_at, true)}</Text></Td>
                      <Td><Mono fontWeight={600} color={m.direction === 'in' ? 'ink.900' : 'ember.600'}>{m.direction === 'in' ? '+' : '-'}{unitLabel(m.quantity, m.unit)}</Mono></Td>
                      <Td><Text fontSize="sm">{STOCK_REASONS[m.reason] || m.reason}</Text></Td>
                      <Td><Mono>{m.initials}</Mono></Td>
                      <Td><Text fontSize="sm" color="ink.500">{m.note || ''}</Text></Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </GridItem>
      </Grid>
      <MoveDrawer isOpen={move.isOpen} onClose={move.onClose} item={item} direction={direction} onDone={load} />
      <ItemDrawer isOpen={edit.isOpen} onClose={edit.onClose} item={item} onDone={load} />
    </MotionFade>
  )
}
