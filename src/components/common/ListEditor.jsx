import { Button, HStack, IconButton, Input, Stack, Text } from '@chakra-ui/react'
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2 } from 'react-icons/fi'

/**
 * Ordered list of short strings (features, sizes). Add / edit inline / reorder / remove.
 */
export default function ListEditor({ value = [], onChange, placeholder = 'New item', addLabel = 'Add item' }) {
  const update = (i, v) => onChange(value.map((x, idx) => (idx === i ? v : x)))
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  return (
    <Stack spacing={2}>
      {value.length === 0 && (
        <Text fontSize="sm" color="ink.300">
          No items yet.
        </Text>
      )}
      {value.map((item, i) => (
        <HStack key={i}>
          <Input size="sm" value={item} placeholder={placeholder} onChange={(e) => update(i, e.target.value)} />
          <IconButton size="sm" variant="ghost" aria-label="Move up" icon={<FiArrowUp />} onClick={() => move(i, -1)} isDisabled={i === 0} />
          <IconButton size="sm" variant="ghost" aria-label="Move down" icon={<FiArrowDown />} onClick={() => move(i, 1)} isDisabled={i === value.length - 1} />
          <IconButton size="sm" variant="ghost" colorScheme="red" aria-label="Remove" icon={<FiTrash2 />} onClick={() => remove(i)} />
        </HStack>
      ))}
      <Button size="sm" variant="outline" leftIcon={<FiPlus />} alignSelf="flex-start" onClick={() => onChange([...value, ''])}>
        {addLabel}
      </Button>
    </Stack>
  )
}
