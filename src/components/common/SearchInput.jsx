import { Input, InputGroup, InputLeftElement, InputRightElement, IconButton } from '@chakra-ui/react'
import { FiSearch, FiX } from 'react-icons/fi'

export default function SearchInput({ value, onChange, placeholder = 'Search', ...rest }) {
  return (
    <InputGroup maxW={{ base: 'full', md: '320px' }} {...rest}>
      <InputLeftElement pointerEvents="none" color="ink.300">
        <FiSearch />
      </InputLeftElement>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
      {value && (
        <InputRightElement>
          <IconButton
            aria-label="Clear search"
            icon={<FiX />}
            size="xs"
            variant="ghost"
            onClick={() => onChange('')}
          />
        </InputRightElement>
      )}
    </InputGroup>
  )
}
