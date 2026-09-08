// src/components/brand/Logo.jsx
//
// The same digital lockup as the storefront: a clean line fishbone with a
// red eye, FISHBONE in the display face, GRAPHICS spanning the same width
// under it, and a small red BACKSTAGE beside GRAPHICS so you know which app
// you are in. `tone` picks the ink for the mark and type: 'dark' is bone on
// ink (sidebar, login panel), 'light' is ink on paper.
//
// The shop's real oval logo is drawn separately by OvalLogo in this file
// as a CSS mask over public/brand-oval.svg, so it takes any color.
//
// No oxford commas, no em dashes.

import { Box, HStack, Text } from '@chakra-ui/react'

// The accent. Orange in Pulse, red on the storefront. The eye follows it.
const RED = '#FF6A13'

export function FishboneMark({ size = 32, tone = 'dark', ...rest }) {
  const color = tone === 'dark' ? '#EFEAE0' : '#161618'
  return (
    <Box as="svg" viewBox="0 0 96 64" width={`${Math.round(size * 1.5)}px`} height={`${size}px`} flexShrink={0} aria-hidden="true" {...rest}>
      <g fill="none" stroke={color} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 32c0-10 8-18 18-18 5 0 9 2 11 4l-4 14 4 14c-2 2-6 4-11 4-10 0-18-8-18-18z" />
        <path d="M35 32h40" />
        <path d="M42 32l-3-11M42 32l-3 11M50 32l-3-13M50 32l-3 13M58 32l-3-11M58 32l-3 11M66 32l-2.5-8M66 32l-2.5 8" />
        <path d="M75 32l14-13M75 32l14 13M89 19v26" />
      </g>
      <circle cx="17" cy="27" r="3.4" fill={RED} />
    </Box>
  )
}

export default function Logo({ size = 36, tone = 'dark', showText = true, sub = 'Backstage', ...rest }) {
  const color = tone === 'dark' ? '#EFEAE0' : '#161618'
  const h = Math.round(size * 0.9)
  return (
    <HStack spacing={3} align="center" {...rest}>
      <FishboneMark size={Math.round(size * 0.78)} tone={tone} />
      {showText && (
        <Box as="svg" viewBox="0 0 166 64" height={`${h}px`} role="img" aria-label={`Fishbone Graphics ${sub || ''}`} display="block">
          <text x="0" y="38" fill={color} fontFamily="'Barlow Condensed', 'Arial Narrow', sans-serif" fontWeight="700" fontSize="46" letterSpacing="0.5">FISHBONE</text>
          <text x="0" y="60" fill={color} fontFamily="'Barlow Condensed', 'Arial Narrow', sans-serif" fontWeight="600" fontSize="24" textLength="163" lengthAdjust="spacing" opacity="0.85">GRAPHICS</text>
        </Box>
      )}
      {showText && sub && (
        <Text fontFamily="mono" fontSize="10px" letterSpacing="0.22em" textTransform="uppercase" color={RED} alignSelf="flex-end" mb="2px" whiteSpace="nowrap">
          {sub}
        </Text>
      )}
    </HStack>
  )
}

const RATIO = 100 / 213

export function OvalLogo({ w = '160px', color = '#EFEAE0', eye = true, ...rest }) {
  return (
    <Box position="relative" w={w} display="inline-block" aria-label="Fishbone Graphics" role="img" {...rest}>
      <Box w="100%" pt={`${RATIO * 100}%`} bg={color} sx={{ maskImage: 'url(/brand-oval.svg)', WebkitMaskImage: 'url(/brand-oval.svg)', maskSize: '100% 100%', WebkitMaskSize: '100% 100%', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat' }} />
      {eye && <Box aria-hidden="true" position="absolute" left="23.1%" top="31.8%" w="2.7%" pt="2.7%" transform="translate(-50%, -50%)" borderRadius="full" bg={RED} />}
    </Box>
  )
}
