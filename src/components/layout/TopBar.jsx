import {
  Avatar,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  Kbd,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { FiMenu, FiSearch, FiLogOut, FiSettings, FiExternalLink, FiChevronDown } from 'react-icons/fi'
import { useAuth } from '../../hooks/useAuth'

export default function TopBar({ onOpenMenu, onOpenSearch }) {
  const { user, profile, role, displayName: name, signOut } = useAuth()
  const navigate = useNavigate()
  const isMobile = useBreakpointValue({ base: true, md: false })

  const handleSignOut = async () => {
    await signOut()
    navigate('/login/', { replace: true })
  }

  return (
    <Flex
      as="header"
      h="60px"
      px={{ base: 3, md: 6 }}
      align="center"
      gap={3}
      bg="paper"
      borderBottom="1px solid"
      borderColor="bone.200"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <IconButton
        aria-label="Open navigation"
        icon={<FiMenu />}
        variant="ghost"
        display={{ base: 'inline-flex', lg: 'none' }}
        onClick={onOpenMenu}
      />

      <Button
        onClick={onOpenSearch}
        variant="outline"
        leftIcon={<FiSearch />}
        fontFamily="body"
        textTransform="none"
        letterSpacing="normal"
        fontWeight={400}
        color="ink.500"
        justifyContent="flex-start"
        flex="1"
        maxW="480px"
        size="sm"
        h="38px"
        rightIcon={!isMobile ? <Kbd fontSize="10px">/</Kbd> : undefined}
      >
        <Text as="span" flex="1" textAlign="left" noOfLines={1}>
          {isMobile ? 'Search' : 'Search orders, emails, products'}
        </Text>
      </Button>

      <Box flex="1" />

      <Menu placement="bottom-end">
        <MenuButton as={Button} variant="ghost" size="sm" rightIcon={<FiChevronDown />} textTransform="none" letterSpacing="normal" fontFamily="body" fontWeight={500}>
          <HStack spacing={2}>
            <Avatar size="xs" name={name} bg="ember.500" color="white" />
            <Text display={{ base: 'none', md: 'block' }} fontSize="sm">
              {name}
            </Text>
          </HStack>
        </MenuButton>
        <MenuList>
          <Box px={3} py={2}>
            <Text fontSize="sm" fontWeight={600}>
              {name}
            </Text>
            <Text fontSize="xs" color="ink.500" noOfLines={1}>
              {profile?.username ? `@${profile.username} · ` : ''}
              {user?.email}
            </Text>
            {role && (
              <Text fontSize="xs" color="river.600" fontFamily="heading" textTransform="uppercase" letterSpacing="0.08em" mt={0.5}>
                {role}
              </Text>
            )}
          </Box>
          <MenuDivider />
          <MenuItem as={RouterLink} to="/settings?tab=account" icon={<FiSettings />}>
            Account settings
          </MenuItem>
          <MenuItem as="a" href="https://fishbonegraphics.com" target="_blank" rel="noreferrer" icon={<FiExternalLink />}>
            Open storefront
          </MenuItem>
          <MenuDivider />
          <MenuItem icon={<FiLogOut />} onClick={handleSignOut} color="red.600">
            Sign out
          </MenuItem>
        </MenuList>
      </Menu>
    </Flex>
  )
}
