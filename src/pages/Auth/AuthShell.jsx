import { Box, Flex, Heading, HStack, Text } from '@chakra-ui/react'
import Logo from '../../components/brand/Logo'
import RegMark from '../../components/common/RegMark'
import PulledRule from '../../components/common/PulledRule'
import MotionFade from '../../components/common/MotionFade'

/**
 * Two-panel public layout: ink brand panel + paper form panel.
 * Used by Login, Request account, Reset password and Accept invite.
 */
export default function AuthShell({ eyebrow = 'Fishbone Pulse', title, intro, children, footer, headline = 'Every job, from art approval to pickup.' }) {
  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
      <Box
        flex={{ lg: '0 0 44%' }}
        bg="ink.900"
        color="bone.500"
        p={{ base: 5, md: 10, lg: 14 }}
        position="relative"
        overflow="hidden"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        minH={{ base: 'auto', lg: '100vh' }}
      >
        <Box
          position="absolute"
          inset={0}
          opacity={0.25}
          pointerEvents="none"
          bgImage="radial-gradient(circle, rgba(242,237,228,0.5) 1px, transparent 1.5px)"
          bgSize="7px 7px"
          sx={{
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent 55%)',
          }}
        />
        <Logo tone="dark" size={44} position="relative" />
        <Box position="relative" display={{ base: 'none', lg: 'block' }}>
          <HStack spacing={2} color="ember.500" mb={3}>
            <RegMark size={14} />
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" fontWeight={600}>
              Shop control room
            </Text>
          </HStack>
          <Heading size="2xl" color="bone.500" lineHeight="0.95" maxW="12ch">
            {headline}
          </Heading>
          <PulledRule mt={5} w="88px" />
          <Text mt={5} color="bone.300" maxW="42ch" fontSize="sm">
            Orders, quotes, customers, catalog and shop settings for Fishbone Graphics &amp; Screen Printing. Hand-pulled in
            Ridgway, Colorado since 1985.
          </Text>
        </Box>
        <HStack position="relative" spacing={4} color="bone.400" fontSize="xs" fontFamily="mono" display={{ base: 'none', lg: 'flex' }}>
          <Text>(970) 626-4437</Text>
          <Text>·</Text>
          <Text>@fishbonegraphics</Text>
        </HStack>
      </Box>

      <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 12 }} bg="paper">
        <MotionFade style={{ width: '100%', maxWidth: 420 }}>
          <Box w="full">
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="ink.500" fontWeight={600}>
              {eyebrow}
            </Text>
            <Heading size="xl" mt={1} lineHeight="1">
              {title}
            </Heading>
            {intro && (
              <Text color="ink.500" fontSize="sm" mt={2}>
                {intro}
              </Text>
            )}
            <Box mt={8}>{children}</Box>
            {footer && (
              <Box mt={8} fontSize="xs" color="ink.300">
                {footer}
              </Box>
            )}
          </Box>
        </MotionFade>
      </Flex>
    </Flex>
  )
}
