import { Box, HStack, Text } from '@chakra-ui/react'

/**
 * Fishbone Graphics wordmark placeholder.
 * Swap this single file once the client's real logo arrives.
 *
 * @param {'dark'|'light'} tone  dark = bone mark on ink (default), light = ink mark on paper
 */
export function FishboneMark({ size = 32, tone = 'dark', ...rest }) {
  const bone = tone === 'dark' ? '#F2EDE4' : '#0B0B0C'
  const ink = tone === 'dark' ? '#0B0B0C' : '#FAF7F2'
  return (
    <Box as="svg" viewBox="0 0 64 64" width={`${size}px`} height={`${size}px`} flexShrink={0} {...rest}>
      <rect width="64" height="64" rx="8" fill={ink} />
      <g fill="none" stroke={bone} strokeWidth="3.2" strokeLinecap="round">
        <path d="M10 32 H46" />
        <path d="M18 32 L22 22 M18 32 L22 42 M26 32 L30 23 M26 32 L30 41 M34 32 L38 25 M34 32 L38 39" />
        <path d="M46 32 L56 22 M46 32 L56 42" />
      </g>
      <circle cx="12" cy="32" r="6" fill={bone} />
      <circle cx="13.5" cy="30.5" r="1.6" fill={ink} />
      <circle cx="54" cy="12" r="4" fill="#FF6A13" />
    </Box>
  )
}

export default function Logo({ size = 36, tone = 'dark', showText = true, sub = 'Pulse', ...rest }) {
  const textColor = tone === 'dark' ? 'bone.500' : 'ink.900'
  const subColor = tone === 'dark' ? 'bone.400' : 'ink.500'
  return (
    <HStack spacing={3} align="center" {...rest}>
      <FishboneMark size={size} tone={tone} />
      {showText && (
        <Box lineHeight="1">
          <Text
            fontFamily="heading"
            fontWeight={800}
            fontSize={`${Math.round(size * 0.62)}px`}
            letterSpacing="-0.01em"
            textTransform="uppercase"
            color={textColor}
            lineHeight="1"
          >
            Fishbone
          </Text>
          <HStack spacing={2} mt="2px">
            <Text
              fontFamily="heading"
              fontWeight={600}
              fontSize={`${Math.round(size * 0.28)}px`}
              letterSpacing="0.18em"
              textTransform="uppercase"
              color={subColor}
              lineHeight="1"
            >
              Graphics
            </Text>
            {sub && (
              <Text
                fontFamily="heading"
                fontWeight={700}
                fontSize={`${Math.round(size * 0.28)}px`}
                letterSpacing="0.18em"
                textTransform="uppercase"
                color="ember.500"
                lineHeight="1"
              >
                {sub}
              </Text>
            )}
          </HStack>
        </Box>
      )}
    </HStack>
  )
}
