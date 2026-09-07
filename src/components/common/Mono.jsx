import { Text } from '@chakra-ui/react'

/** Job-ticket style mono text for order numbers, SKUs, money in tables. */
export default function Mono({ children, ...rest }) {
  return (
    <Text as="span" fontFamily="mono" fontSize="sm" letterSpacing="0.01em" whiteSpace="nowrap" {...rest}>
      {children}
    </Text>
  )
}
