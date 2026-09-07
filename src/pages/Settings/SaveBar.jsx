import { Button, HStack, Text } from '@chakra-ui/react'
import { FiSave } from 'react-icons/fi'

export default function SaveBar({ onSave, saving, dirty }) {
  return (
    <HStack justify="flex-end" mt={5}>
      {dirty && (
        <Text fontSize="xs" color="ink.500">
          Unsaved changes
        </Text>
      )}
      <Button size="sm" leftIcon={<FiSave />} onClick={onSave} isLoading={saving} isDisabled={!dirty}>
        Save
      </Button>
    </HStack>
  )
}
