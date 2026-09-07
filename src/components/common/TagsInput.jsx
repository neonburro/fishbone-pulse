import { useState } from 'react'
import { Box, HStack, Input, Tag, TagCloseButton, TagLabel, Wrap, WrapItem } from '@chakra-ui/react'

/**
 * Simple tags editor: type and press Enter or comma to add; Backspace on empty removes last.
 * @param {string[]} value
 * @param {(next: string[]) => void} onChange
 */
export default function TagsInput({ value = [], onChange, placeholder = 'Type and press Enter', suggestions = [] }) {
  const [draft, setDraft] = useState('')

  const add = (raw) => {
    const t = raw.trim()
    if (!t) return
    if (value.some((v) => v.toLowerCase() === t.toLowerCase())) return
    onChange([...value, t])
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add(draft)
      setDraft('')
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1))
    }
  }

  const unused = suggestions.filter((s) => !value.some((v) => v.toLowerCase() === s.toLowerCase()))

  return (
    <Box>
      <Box
        border="1px solid"
        borderColor="bone.300"
        borderRadius="base"
        bg="white"
        px={2}
        py={1.5}
        _focusWithin={{ borderColor: 'ember.500', boxShadow: '0 0 0 1px #FF6A13' }}
      >
        <Wrap spacing={1.5} align="center">
          {value.map((tag) => (
            <WrapItem key={tag}>
              <Tag size="sm" bg="paper2" color="ink.900" borderRadius="sm">
                <TagLabel>{tag}</TagLabel>
                <TagCloseButton aria-label={`Remove ${tag}`} onClick={() => onChange(value.filter((v) => v !== tag))} />
              </Tag>
            </WrapItem>
          ))}
          <WrapItem flex="1" minW="140px">
            <Input
              variant="unstyled"
              size="sm"
              value={draft}
              placeholder={value.length ? '' : placeholder}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onKeyDown}
              onBlur={() => {
                if (draft.trim()) {
                  add(draft)
                  setDraft('')
                }
              }}
            />
          </WrapItem>
        </Wrap>
      </Box>
      {unused.length > 0 && (
        <HStack mt={1.5} spacing={1} flexWrap="wrap">
          {unused.map((s) => (
            <Tag
              key={s}
              size="sm"
              variant="outline"
              color="ink.500"
              cursor="pointer"
              borderRadius="sm"
              onClick={() => add(s)}
              _hover={{ bg: 'paper2' }}
            >
              + {s}
            </Tag>
          ))}
        </HStack>
      )}
    </Box>
  )
}
