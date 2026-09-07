import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FiEye, FiEyeOff } from 'react-icons/fi'
import Logo from '../components/brand/Logo'
import RegMark from '../components/common/RegMark'
import PulledRule from '../components/common/PulledRule'
import MotionFade from '../components/common/MotionFade'
import { useAuthStore } from '../store/authStore'
import { friendlyError, supabaseConfigured } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(supabaseConfigured ? '' : 'Supabase is not configured. Copy .env.example to .env and restart.')
  const navigate = useNavigate()
  const location = useLocation()
  const { status, init, signIn } = useAuthStore()

  useEffect(() => {
    if (status === 'loading') init()
  }, [status, init])

  useEffect(() => {
    if (status === 'admin') navigate(location.state?.from || '/', { replace: true })
    if (status === 'not_admin') navigate('/', { replace: true })
  }, [status, navigate, location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await signIn(email.trim(), password)
      if (result === 'admin') navigate(location.state?.from || '/', { replace: true })
      // not_admin: ProtectedRoute at "/" renders the Not authorized screen
      else navigate('/', { replace: true })
    } catch (err) {
      setError(friendlyError(err, 'Sign in failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Flex minH="100vh" direction={{ base: 'column', lg: 'row' }}>
      {/* Brand panel */}
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
            Every job, from art approval to pickup.
          </Heading>
          <PulledRule mt={5} w="88px" />
          <Text mt={5} color="bone.300" maxW="42ch" fontSize="sm">
            Orders, quotes, customers, catalog and shop settings for Fishbone Graphics &amp; Screen Printing.
            Hand-pulled in Ridgway, Colorado since 1985.
          </Text>
        </Box>
        <HStack position="relative" spacing={4} color="bone.400" fontSize="xs" fontFamily="mono" display={{ base: 'none', lg: 'flex' }}>
          <Text>(970) 626-4437</Text>
          <Text>·</Text>
          <Text>@fishbonegraphics</Text>
        </HStack>
      </Box>

      {/* Form panel */}
      <Flex flex="1" align="center" justify="center" p={{ base: 6, md: 12 }} bg="paper">
        <MotionFade style={{ width: '100%', maxWidth: 400 }}>
          <Box w="full">
            <Text
              fontFamily="heading"
              fontSize="xs"
              letterSpacing="0.12em"
              textTransform="uppercase"
              color="ink.500"
              fontWeight={600}
            >
              Fishbone Pulse
            </Text>
            <Heading size="xl" mt={1} lineHeight="1">
              Sign in
            </Heading>
            <Text color="ink.500" fontSize="sm" mt={2}>
              Admin access only. Use the email and password you were given for the shop.
            </Text>

            <Box as="form" onSubmit={handleSubmit} mt={8} noValidate>
              <VStack spacing={4} align="stretch">
                {error && (
                  <Alert status="error" borderRadius="base" fontSize="sm" role="alert">
                    <AlertIcon />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <FormControl isRequired>
                  <FormLabel htmlFor="email">Email</FormLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="username"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@fishbonegraphics.com"
                    size="lg"
                    autoFocus
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel htmlFor="password">Password</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        size="sm"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <FiEyeOff /> : <FiEye />}
                        onClick={() => setShowPassword((v) => !v)}
                        tabIndex={-1}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Button type="submit" size="lg" colorScheme="ember" isLoading={loading} loadingText="Signing in" w="full" mt={2}>
                  Sign in
                </Button>
              </VStack>
            </Box>

            <Text mt={8} fontSize="xs" color="ink.300">
              Forgot your password? Ask another admin to reset it from the Supabase dashboard (Authentication → Users).
            </Text>
          </Box>
        </MotionFade>
      </Flex>
    </Flex>
  )
}
