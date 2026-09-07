import { Box, Button, HStack, IconButton, Input, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { FiPlus, FiTrash2 } from 'react-icons/fi'
import { formatMoney } from '../../utils/money'
import { emptyTier, validateTiers } from '../../lib/tiers'

export default function TiersEditor({ value = [], onChange, basePrice }) {
  const problems = validateTiers(value)
  const update = (i, patch) => onChange(value.map((t, idx) => (idx === i ? { ...t, ...patch } : t)))
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i))
  const add = () => {
    const last = value[value.length - 1]
    const nextMin = last && last.max_qty !== '' && last.max_qty !== null ? parseInt(last.max_qty, 10) + 1 : last ? (parseInt(last.min_qty, 10) || 0) + 12 : 1
    onChange([...value, emptyTier(nextMin)])
  }

  return (
    <Box>
      <Text fontSize="sm" color="ink.500" mb={3}>
        Quantity price breaks. Leave the last tier's maximum blank for “and up”. Without tiers, the base price{' '}
        {basePrice ? `(${formatMoney(basePrice)})` : ''} applies to every quantity.
      </Text>
      {value.length > 0 && (
        <Box overflowX="auto" mb={3}>
          <Table size="sm">
            <Thead>
              <Tr>
                <Th w="140px">Min qty</Th>
                <Th w="140px">Max qty</Th>
                <Th w="160px">Unit price</Th>
                <Th>Range</Th>
                <Th w="50px"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {value.map((t, i) => (
                <Tr key={t.id || t._key}>
                  <Td>
                    <Input size="sm" type="number" min={1} fontFamily="mono" value={t.min_qty} onChange={(e) => update(i, { min_qty: e.target.value })} />
                  </Td>
                  <Td>
                    <Input size="sm" type="number" min={1} fontFamily="mono" value={t.max_qty ?? ''} placeholder="∞" onChange={(e) => update(i, { max_qty: e.target.value })} />
                  </Td>
                  <Td>
                    <Input size="sm" type="number" step="0.01" min={0} fontFamily="mono" value={t.unit_price} placeholder="0.00" onChange={(e) => update(i, { unit_price: e.target.value })} />
                  </Td>
                  <Td fontSize="xs" color="ink.500" fontFamily="mono">
                    {t.min_qty || '?'}–{t.max_qty === '' || t.max_qty === null ? '∞' : t.max_qty} @ {formatMoney(t.unit_price)}
                  </Td>
                  <Td>
                    <IconButton size="xs" variant="ghost" colorScheme="red" aria-label="Remove tier" icon={<FiTrash2 />} onClick={() => remove(i)} />
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      {problems.length > 0 && (
        <Box bg="red.50" border="1px solid" borderColor="red.200" borderRadius="base" p={3} mb={3}>
          {problems.map((p) => (
            <Text key={p} fontSize="xs" color="red.700">
              {p}
            </Text>
          ))}
        </Box>
      )}
      <HStack>
        <Button size="sm" variant="outline" leftIcon={<FiPlus />} onClick={add}>
          Add tier
        </Button>
        {value.length === 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onChange([
                { ...emptyTier(12), max_qty: 23, unit_price: basePrice || '' },
                { ...emptyTier(24), max_qty: 47, unit_price: '' },
                { ...emptyTier(48), max_qty: 99, unit_price: '' },
                { ...emptyTier(100), max_qty: '', unit_price: '' },
              ])
            }
          >
            Start from 12 / 24 / 48 / 100
          </Button>
        )}
      </HStack>
    </Box>
  )
}
