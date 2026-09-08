// src/components/layout/Sidebar.jsx
//
// Ink rail on the left. Lockup at the top, the rooms in the middle, and you
// at the bottom: your face, your name, your role. Tap yourself and you land
// in Settings. There is no Settings item in the list, you are the settings
// item.

import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { FiGrid, FiClipboard, FiMessageSquare, FiUsers, FiTag, FiLayers, FiImage, FiFeather, FiBox, FiChevronRight, FiTrash2 } from 'react-icons/fi'
import Logo from '../brand/Logo'
import MemberAvatar from '../crew/MemberAvatar'
import { useAuth } from '../../hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: FiGrid, end: true },
  { label: 'Runs', to: '/orders', icon: FiClipboard },
  { label: 'Requests', to: '/quotes', icon: FiMessageSquare },
  { label: 'Customers', to: '/customers', icon: FiUsers },
  { label: 'Stock', to: '/stock', icon: FiBox },
  { label: 'Blanks', to: '/products', icon: FiTag },
  { label: 'Categories', to: '/categories', icon: FiLayers },
  { label: 'The wall', to: '/showcase', icon: FiImage },
  { label: 'Notes', to: '/notes', icon: FiFeather },
]

export default function Sidebar({ onNavigate, badges = {} }) {
  const { user, profile, role, displayName } = useAuth()
  const me = { user_id: user?.id, name: displayName, avatar_url: profile?.avatar_url, online: true }
  return (
    <Flex direction="column" h="full" bg="ink.900" color="bone.300">
      <Box px={5} py={5} borderBottom="1px solid" borderColor="ink.600">
        <Logo tone="dark" size={34} />
      </Box>
      <VStack as="nav" align="stretch" spacing={0.5} px={3} py={4} flex="1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <HStack px={3} py={2.5} borderRadius="sm" spacing={3} bg={isActive ? 'ink.700' : 'transparent'} color={isActive ? 'bone.500' : 'bone.300'} borderLeft="2px solid" borderLeftColor={isActive ? 'ember.500' : 'transparent'} _hover={{ bg: 'ink.800', color: 'bone.500' }} transition="background 0.15s">
                <Box as={item.icon} boxSize="18px" opacity={isActive ? 1 : 0.8} />
                <Text fontFamily="heading" fontWeight={600} fontSize="md" letterSpacing="0.06em" textTransform="uppercase" flex="1">{item.label}</Text>
                {badges[item.to] > 0 && (
                  <Box minW="20px" h="20px" px={1.5} borderRadius="full" bg="ember.500" color="#161618" fontFamily="mono" fontSize="11px" fontWeight={500} display="flex" alignItems="center" justifyContent="center">{badges[item.to]}</Box>
                )}
              </HStack>
            )}
          </NavLink>
        ))}
      </VStack>
      <NavLink to="/trash" onClick={onNavigate} style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <HStack px={6} py={2} spacing={2} color={isActive ? 'bone.500' : 'bone.400'} _hover={{ color: 'bone.500' }}>
            <Box as={FiTrash2} boxSize="13px" />
            <Text fontFamily="mono" fontSize="10px" letterSpacing="0.16em" textTransform="uppercase">Trash</Text>
          </HStack>
        )}
      </NavLink>
      <NavLink to="/settings" onClick={onNavigate} style={{ textDecoration: 'none' }}>
        {({ isActive }) => (
          <HStack px={4} py={4} spacing={3} borderTop="1px solid" borderColor="ink.600" bg={isActive ? 'ink.700' : 'transparent'} _hover={{ bg: 'ink.800' }} transition="background 0.15s" role="group" aria-label="Your settings">
            <MemberAvatar member={me} size="md" presence label="Settings" />
            <Box flex={1} minW={0}>
              <Text fontFamily="heading" fontWeight={600} fontSize="md" letterSpacing="0.04em" textTransform="uppercase" color="bone.500" noOfLines={1} lineHeight={1.1}>{displayName}</Text>
              <Text fontFamily="mono" fontSize="10px" letterSpacing="0.14em" textTransform="uppercase" color="bone.400" mt={0.5}>{role || 'crew'} · settings</Text>
            </Box>
            <Box color="bone.400" _groupHover={{ color: 'ember.500' }}><FiChevronRight /></Box>
          </HStack>
        )}
      </NavLink>
    </Flex>
  )
}
