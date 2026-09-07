import { Alert, AlertDescription, AlertIcon } from '@chakra-ui/react'

export default function AuthAlert({ status = 'error', children }) {
  if (!children) return null
  return (
    <Alert status={status} borderRadius="base" fontSize="sm" role="alert" alignItems="flex-start">
      <AlertIcon mt="1px" />
      <AlertDescription>{children}</AlertDescription>
    </Alert>
  )
}
