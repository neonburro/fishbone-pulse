import { Box } from '@chakra-ui/react'

/** "Pulled" rule: 2px ember line with a slightly rough trailing end, like a squeegee pull. */
export default function PulledRule({ w = '64px', color = 'ember.500', ...rest }) {
  return (
    <Box position="relative" h="2px" w={w} bg={color} borderRadius="1px" {...rest}>
      <Box position="absolute" right="-6px" top="-1px" w="6px" h="4px" bg={color} opacity={0.55} borderRadius="0 2px 2px 0" />
      <Box position="absolute" right="-10px" top="0" w="3px" h="2px" bg={color} opacity={0.3} />
    </Box>
  )
}
