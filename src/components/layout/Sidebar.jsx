import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react'
import { NavLink } from 'react-router-dom'
import { FiGrid, FiClipboard, FiMessageSquare, FiUsers, FiTag, FiLayers, FiSettings } from 'react-icons/fi'
import Logo from '../brand/Logo'

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: FiGrid, end: true },
  { label: 'Orders', to: '/orders', icon: FiClipboard },
  { label: 'Quotes', to: '/quotes', icon: FiMessageSquare },
  { label: 'Customers', to: '/customers', icon: FiUsers },
  { label: 'Products', to: '/products', icon: FiTag },
  { label: 'Categories', to: '/categories', icon: FiLayers },
  { label: 'Settings', to: '/settings', icon: FiSettings },
]

export default function Sidebar({ onNavigate, badges = {} }) {
  return (
    <Flex direction="column" h="full" bg="ink.900" color="bone.300">
      <Box px={5} py={5} borderBottom="1px solid" borderColor="ink.600">
        <Logo tone="dark" size={36} />
      </Box>
      <VStack as="nav" align="stretch" spacing={0.5} px={3} py={4} flex="1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} style={{ textDecoration: 'none' }}>
            {({ isActive }) => (
              <HStack
                px={3}
                py={2.5}
                borderRadius="base"
                spacing={3}
                bg={isActive ? 'ink.700' : 'transparent'}
                color={isActive ? 'bone.500' : 'bone.300'}
                borderLeft="2px solid"
                borderLeftColor={isActive ? 'ember.500' : 'transparent'}
                _hover={{ bg: 'ink.800', color: 'bone.500' }}
                transition="background 0.15s"
              >
                <Box as={item.icon} boxSize="18px" opacity={isActive ? 1 : 0.8} />
                <Text fontFamily="heading" fontWeight={600} fontSize="md" letterSpacing="0.06em" textTransform="uppercase" flex="1">
                  {item.label}
                </Text>
                {badges[item.to] > 0 && (
                  <Box
                    minW="20px"
                    h="20px"
                    px={1.5}
                    borderRadius="full"
                    bg="hivis.400"
                    color="ink.900"
                    fontFamily="mono"
                    fontSize="11px"
                    fontWeight={500}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {badges[item.to]}
                  </Box>
                )}
              </HStack>
            )}
          </NavLink>
        ))}
      </VStack>
      <Box px={5} py={4} borderTop="1px solid" borderColor="ink.600">
        <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" textTransform="uppercase" color="bone.400">
          Ridgway, Colorado
        </Text>
        <Text fontFamily="mono" fontSize="xs" color="bone.400" mt={0.5}>
          Printing since 1985
        </Text>
      </Box>
    </Flex>
  )
}
