import { useCallback, useEffect, useState } from 'react'
import {
  Avatar,
  Badge,
  Box,
  Button,
  Checkbox,
  Code,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { FiCheck, FiChevronDown, FiTrash2, FiUserPlus, FiX } from 'react-icons/fi'
import Card from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorState from '../../components/common/ErrorState'
import EmptyState from '../../components/common/EmptyState'
import { useAuth } from '../../hooks/useAuth'
import { ROLES } from '../../lib/api/auth'
import { approveRequest, declineRequest, inviteMember, listTeam, removeMember, setMemberRole } from '../../lib/api/team'
import { formatDate, formatDateTime, timeAgo } from '../../utils/format'

const ROLE_META = {
  owner: { label: 'Owner', bg: 'ember.100', color: 'ember.800', help: 'Everything, including managing owners.' },
  admin: { label: 'Admin', bg: 'river.100', color: 'river.800', help: 'Full shop access and team management.' },
  staff: { label: 'Staff', bg: 'bone.200', color: 'ink.700', help: 'Orders, quotes, customers and catalog.' },
}

export function RoleBadge({ role }) {
  const m = ROLE_META[role] || ROLE_META.staff
  return (
    <Badge bg={m.bg} color={m.color} fontSize="xs">
      {m.label}
    </Badge>
  )
}

export default function TeamTab() {
  const { user, role: myRole } = useAuth()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [invite, setInvite] = useState({ email: '', display_name: '', role: 'staff' })
  const [inviting, setInviting] = useState(false)
  const [pendingRemove, setPendingRemove] = useState(null)
  const [deleteLogin, setDeleteLogin] = useState(false)
  const removeDialog = useDisclosure()
  const [approveRole, setApproveRole] = useState({})

  const isOwner = myRole === 'owner'
  const assignable = ROLES.filter((r) => r !== 'owner' || isOwner)

  const load = useCallback(async () => {
    setError('')
    try {
      setData(await listTeam())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const fail = (title, err) => toast({ title, description: err.message, status: 'error' })

  const sendInvite = async (e) => {
    e.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.email.trim())) return toast({ title: 'Enter a valid email', status: 'warning' })
    setInviting(true)
    try {
      await inviteMember(invite)
      toast({ title: 'Invite sent', description: `${invite.email.trim()} will get an email with a setup link.`, status: 'success' })
      setInvite({ email: '', display_name: '', role: 'staff' })
      await load()
    } catch (err) {
      fail('Could not send invite', err)
    } finally {
      setInviting(false)
    }
  }

  const changeRole = async (member, role) => {
    if (role === member.role) return
    setBusy(member.user_id)
    try {
      await setMemberRole(member.user_id, role)
      setData((d) => ({ ...d, members: d.members.map((m) => (m.user_id === member.user_id ? { ...m, role } : m)) }))
      toast({ title: `${member.display_name || member.email} is now ${ROLE_META[role]?.label || role}`, status: 'success', duration: 1500 })
    } catch (err) {
      fail('Could not change role', err)
    } finally {
      setBusy('')
    }
  }

  const confirmRemove = async () => {
    if (!pendingRemove) return
    setBusy(pendingRemove.user_id)
    try {
      await removeMember(pendingRemove.user_id, { delete_user: deleteLogin })
      toast({ title: `Removed ${pendingRemove.display_name || pendingRemove.email}`, status: 'success' })
      setData((d) => ({ ...d, members: d.members.filter((m) => m.user_id !== pendingRemove.user_id) }))
      removeDialog.onClose()
      setPendingRemove(null)
      setDeleteLogin(false)
    } catch (err) {
      fail('Could not remove member', err)
    } finally {
      setBusy('')
    }
  }

  const approve = async (req) => {
    const role = approveRole[req.id] || 'staff'
    setBusy(req.id)
    try {
      await approveRequest(req.id, role)
      toast({ title: `Approved ${req.name || req.email}`, description: 'They will receive an invite email.', status: 'success' })
      await load()
    } catch (err) {
      fail('Could not approve request', err)
    } finally {
      setBusy('')
    }
  }

  const decline = async (req) => {
    setBusy(req.id)
    try {
      await declineRequest(req.id)
      toast({ title: `Declined ${req.name || req.email}`, status: 'info', duration: 1500 })
      setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== req.id) }))
    } catch (err) {
      fail('Could not decline request', err)
    } finally {
      setBusy('')
    }
  }

  if (!['owner', 'admin'].includes(myRole)) {
    return (
      <Card>
        <EmptyState title="Admins only" description="Team management is limited to owners and admins. Ask one of them if you need to invite someone." py={8} />
      </Card>
    )
  }

  if (error) return <ErrorState title="Could not load the team" message={error} onRetry={load} />

  const members = data?.members || []
  const requests = (data?.requests || []).filter((r) => !r.status || r.status === 'new')

  return (
    <Stack spacing={5}>
      <SimpleGrid columns={{ base: 1, xl: '3fr 2fr' }} templateColumns={{ xl: '3fr 2fr' }} spacing={5} alignItems="start">
        <Card title={`Members${members.length ? ` · ${members.length}` : ''}`} p={0} sx={{ '& > div:first-of-type': { px: 5, pt: 4, mb: 2 } }}>
          {!data ? (
            <Stack p={4} spacing={2}>
              <Skeleton h="44px" />
              <Skeleton h="44px" />
              <Skeleton h="44px" />
            </Stack>
          ) : members.length === 0 ? (
            <EmptyState title="No team members" description="Invite the first teammate from the form." py={8} />
          ) : (
            <Box overflowX="auto">
              <Table size="sm">
                <Thead>
                  <Tr>
                    <Th>Member</Th>
                    <Th>Role</Th>
                    <Th>Last sign-in</Th>
                    <Th></Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {members.map((m) => {
                    const name = m.profiles?.display_name || m.display_name || m.email
                    const isMe = m.user_id === user?.id
                    const canEdit = !isMe && (isOwner || m.role !== 'owner')
                    const neverSignedIn = m.invited || !m.last_sign_in_at
                    return (
                      <Tr key={m.user_id}>
                        <Td>
                          <HStack spacing={3}>
                            <Avatar size="sm" name={name} src={m.profiles?.avatar_url || undefined} bg="ink.700" color="bone.500" />
                            <Box minW={0}>
                              <HStack spacing={2}>
                                <Text fontWeight={600} noOfLines={1}>
                                  {name}
                                </Text>
                                {isMe && (
                                  <Badge bg="hivis.100" color="hivis.900" fontSize="10px">
                                    You
                                  </Badge>
                                )}
                                {neverSignedIn && (
                                  <Badge bg="yellow.100" color="yellow.800" fontSize="10px">
                                    Invited · never signed in
                                  </Badge>
                                )}
                              </HStack>
                              <Text fontSize="xs" color="ink.500" noOfLines={1}>
                                {m.profiles?.username ? `@${m.profiles.username} · ` : ''}
                                {m.email}
                              </Text>
                            </Box>
                          </HStack>
                        </Td>
                        <Td>
                          {canEdit ? (
                            <Select size="xs" value={m.role} onChange={(e) => changeRole(m, e.target.value)} isDisabled={busy === m.user_id} maxW="120px" fontFamily="heading" textTransform="uppercase" letterSpacing="0.06em" fontWeight={700}>
                              {assignable.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_META[r].label}
                                </option>
                              ))}
                            </Select>
                          ) : (
                            <RoleBadge role={m.role} />
                          )}
                        </Td>
                        <Td whiteSpace="nowrap" color="ink.500" fontSize="xs">
                          {m.last_sign_in_at ? timeAgo(m.last_sign_in_at) : '—'}
                          {m.created_at && (
                            <Text fontSize="xs" color="ink.300">
                              joined {formatDate(m.created_at)}
                            </Text>
                          )}
                        </Td>
                        <Td textAlign="right">
                          {canEdit && (
                            <Menu placement="bottom-end">
                              <MenuButton as={IconButton} size="xs" variant="ghost" aria-label="Member actions" icon={<FiChevronDown />} />
                              <MenuList>
                                <MenuItem
                                  icon={<FiTrash2 />}
                                  color="red.600"
                                  onClick={() => {
                                    setPendingRemove(m)
                                    setDeleteLogin(false)
                                    removeDialog.onOpen()
                                  }}
                                >
                                  Remove from Pulse
                                </MenuItem>
                              </MenuList>
                            </Menu>
                          )}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </Box>
          )}
        </Card>

        <Card title="Invite a teammate">
          <Box as="form" onSubmit={sendInvite}>
            <Stack spacing={3}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input type="email" value={invite.email} onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))} placeholder="teammate@fishbonegraphics.com" />
              </FormControl>
              <FormControl>
                <FormLabel>Display name</FormLabel>
                <Input value={invite.display_name} onChange={(e) => setInvite((i) => ({ ...i, display_name: e.target.value }))} placeholder="Their full name" />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select value={invite.role} onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value }))}>
                  {assignable.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_META[r].label}
                    </option>
                  ))}
                </Select>
                <Text fontSize="xs" color="ink.300" mt={1}>
                  {ROLE_META[invite.role]?.help}
                </Text>
              </FormControl>
              <Button type="submit" size="sm" leftIcon={<FiUserPlus />} isLoading={inviting} loadingText="Sending">
                Send invite
              </Button>
              <Text fontSize="xs" color="ink.300">
                They get an email with a link to <Code fontSize="xs">/accept-invite/</Code> where they pick a username and password.
              </Text>
            </Stack>
          </Box>
        </Card>
      </SimpleGrid>

      <Card title={`Pending account requests${requests.length ? ` · ${requests.length}` : ''}`} p={0} sx={{ '& > div:first-of-type': { px: 5, pt: 4, mb: 2 } }}>
        {!data ? (
          <Stack p={4} spacing={2}>
            <Skeleton h="44px" />
          </Stack>
        ) : requests.length === 0 ? (
          <EmptyState title="No pending requests" description="Requests from the public “Request an account” page show up here." py={8} />
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Who</Th>
                  <Th>Message</Th>
                  <Th>Requested</Th>
                  <Th>Approve as</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {requests.map((r) => (
                  <Tr key={r.id}>
                    <Td>
                      <Text fontWeight={600}>{r.name || '—'}</Text>
                      <Text fontSize="xs" color="ink.500">
                        {r.email}
                        {r.requested_username ? ` · @${r.requested_username}` : ''}
                      </Text>
                    </Td>
                    <Td maxW="320px">
                      <Text fontSize="sm" noOfLines={2} color="ink.700">
                        {r.message || <Text as="span" color="ink.300">No message</Text>}
                      </Text>
                    </Td>
                    <Td whiteSpace="nowrap" fontSize="xs" color="ink.500">
                      {formatDateTime(r.created_at)}
                    </Td>
                    <Td>
                      <Select size="xs" maxW="120px" value={approveRole[r.id] || 'staff'} onChange={(e) => setApproveRole((a) => ({ ...a, [r.id]: e.target.value }))}>
                        {assignable.map((role) => (
                          <option key={role} value={role}>
                            {ROLE_META[role].label}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      <HStack justify="flex-end" spacing={1}>
                        <Button size="xs" leftIcon={<FiCheck />} onClick={() => approve(r)} isLoading={busy === r.id}>
                          Approve
                        </Button>
                        <Button size="xs" variant="ghost" leftIcon={<FiX />} onClick={() => decline(r)} isDisabled={busy === r.id}>
                          Decline
                        </Button>
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>


      <ConfirmDialog
        isOpen={removeDialog.isOpen}
        onClose={() => {
          removeDialog.onClose()
          setPendingRemove(null)
        }}
        onConfirm={confirmRemove}
        isLoading={Boolean(busy) && busy === pendingRemove?.user_id}
        title={`Remove ${pendingRemove?.display_name || pendingRemove?.email}?`}
        confirmLabel="Remove"
        body={
          <Stack spacing={3}>
            <Text>They lose access to Pulse immediately. Orders and notes they created stay put.</Text>
            <Checkbox isChecked={deleteLogin} onChange={(e) => setDeleteLogin(e.target.checked)}>
              Also delete their login entirely
            </Checkbox>
          </Stack>
        }
      />
    </Stack>
  )
}
