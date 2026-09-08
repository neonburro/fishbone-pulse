// src/pages/Auth/AuthShell.jsx
//
// The public frame for sign in, request access, reset password and accept
// invite. Ink on the left with the oval logo (the only mark on the page, it
// links out front) and one line, centered, paper
// on the right with the form. On a phone the ink is a band across the top
// with the oval in it, so the shop's mark is the first thing you see.
// Simple and a little funny. Nothing on it that a crew member would find
// odd at seven in the morning. The lines rotate by weekday, keep adding.

import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { OvalLogo } from '../../components/brand/Logo'
import { STOREFRONT_URL } from '../../lib/constants'
import MotionFade from '../../components/common/MotionFade'

const LINES = [
  'Ink is forever. Passwords are not.',
  'Wash your hands before you touch the keyboard.',
  'Every job, from the first call to the last box.',
  'The squeegee does not care how you slept.',
  'Registration holds. So does the coffee.',
]

export default function AuthShell({ eyebrow = 'Backstage', title, intro, children, footer, headline }) {
  const line = headline || LINES[new Date().getDay() % LINES.length]
  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }} bg="paper">
      <Flex
        flex={{ lg: '0 0 42%' }}
        bg="ink.900"
        color="bone.500"
        p={{ base: 6, md: 8, lg: 12 }}
        direction="column"
        justify="space-between"
        minH={{ base: 'auto', lg: '100vh' }}
        gap={{ base: 6, lg: 10 }}
      >
        {/* One mark only. The oval is the door back out front. */}
        <Text as="a" href={STOREFRONT_URL} fontFamily="mono" fontSize="11px" letterSpacing="0.3em" textTransform="uppercase" color="ember.500" alignSelf={{ base: 'center', lg: 'flex-start' }} _hover={{ color: 'ember.400' }}>
          Backstage
        </Text>
        <Stack spacing={{ base: 4, lg: 7 }} align="center" textAlign="center" alignSelf="center" w="100%">
          <Box as="a" href={STOREFRONT_URL} aria-label="Fishbone Graphics, the storefront" display="block" w={{ base: '150px', lg: 'min(360px, 70%)' }} _hover={{ opacity: 0.85 }} transition="opacity 200ms">
            <OvalLogo w="100%" />
          </Box>
          <Heading size={{ base: 'md', lg: 'xl' }} color="bone.500" lineHeight={1} maxW="16ch" fontWeight={600}>
            {line}
          </Heading>
        </Stack>
        <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="bone.400" textAlign={{ base: 'center', lg: 'left' }} alignSelf={{ base: 'center', lg: 'flex-start' }}>
          Est 1985, Ridgway, CO, (970) 626-4350
        </Text>
      </Flex>

      <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 12 }}>
        <MotionFade style={{ width: '100%', maxWidth: 420 }}>
          <Box w="full">
            <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">
              {eyebrow}
            </Text>
            <Heading size="xl" mt={2} lineHeight="1">
              {title}
            </Heading>
            {intro && (
              <Text color="ink.500" fontSize="sm" mt={2}>
                {intro}
              </Text>
            )}
            <Box mt={8}>{children}</Box>
            {footer && (
              <Box mt={8} fontSize="xs" color="ink.400">
                {footer}
              </Box>
            )}
          </Box>
        </MotionFade>
      </Flex>
    </Flex>
  )
}
