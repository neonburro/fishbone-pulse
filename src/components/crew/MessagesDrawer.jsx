// src/components/crew/MessagesDrawer.jsx
//
// Messages between the crew. A drawer from the right with two views: the
// list of people, and a thread with one of them. Polls every twenty
// seconds. No read receipts beyond the unread dot, no typing indicator.
// It is a note left on the press, not Slack.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, HStack, IconButton, Stack, Text, Textarea, useToast } from '@chakra-ui/react'
import { FiArrowLeft, FiSend } from 'react-icons/fi'
import { listCrew, listConversations, listThread, sendMessage, markThreadRead } from '../../lib/api/crew'
import { useAuth } from '../../hooks/useAuth'
import MemberAvatar from './MemberAvatar'
import { timeAgo } from '../../utils/format'

const POLL = 20 * 1000

export default function MessagesDrawer({ isOpen, onClose, initialPartner = null }) {
  const { user } = useAuth()
  const me = user?.id
  const toast = useToast()
  const [crew, setCrew] = useState([])
  const [convos, setConvos] = useState([])
  const [partner, setPartner] = useState(initialPartner)
  const [thread, setThread] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const endRef = useRef(null)

  const loadList = useCallback(async () => {
    if (!me) return
    const [c, v] = await Promise.all([listCrew(), listConversations(me)])
    setCrew(c.filter((x) => x.user_id !== me))
    setConvos(v)
  }, [me])

  const loadThread = useCallback(async () => {
    if (!me || !partner) return
    setThread(await listThread(me, partner.user_id))
    await markThreadRead(me, partner.user_id)
  }, [me, partner])

  useEffect(() => { if (isOpen) setPartner(initialPartner) }, [isOpen, initialPartner])
  useEffect(() => {
    if (!isOpen) return undefined
    loadList().catch(() => {})
    const t = setInterval(() => { loadList().catch(() => {}); loadThread().catch(() => {}) }, POLL)
    return () => clearInterval(t)
  }, [isOpen, loadList, loadThread])
  useEffect(() => { loadThread().catch(() => {}) }, [loadThread])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [thread.length])

  const send = async () => {
    if (!text.trim() || !partner) return
    setSending(true)
    try {
      await sendMessage(me, partner.user_id, text)
      setText('')
      await loadThread()
    } catch (err) {
      toast({ title: 'Not sent', description: err.message, status: 'error' })
    } finally {
      setSending(false)
    }
  }

  const unreadFor = (id) => convos.find((c) => c.partnerId === id)?.unread || 0
  const lastFor = (id) => convos.find((c) => c.partnerId === id)?.last

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm">
      <DrawerOverlay />
      <DrawerContent bg="paper">
        <DrawerCloseButton />
        <DrawerHeader>
          {partner ? (
            <HStack spacing={3}>
              <IconButton aria-label="Back" icon={<FiArrowLeft />} size="sm" variant="ghost" onClick={() => setPartner(null)} />
              <MemberAvatar member={partner} size="sm" />
              <Box>
                <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" lineHeight={1}>{partner.name}</Text>
                <Text fontSize="xs" color="ink.500">{partner.online ? 'Backstage now' : partner.last_seen_at ? `Seen ${timeAgo(partner.last_seen_at)}` : 'Not seen yet'}</Text>
              </Box>
            </HStack>
          ) : (
            <>
              <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">Crew</Text>
              <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" lineHeight={1} mt={1}>Messages</Text>
            </>
          )}
        </DrawerHeader>
        <DrawerBody px={0}>
          {partner ? (
            <Stack spacing={2} px={5} py={2}>
              {thread.length === 0 && <Text fontSize="sm" color="ink.500">Nothing yet. Leave a note.</Text>}
              {thread.map((m) => {
                const mine = m.sender_id === me
                return (
                  <Box key={m.id} alignSelf={mine ? 'flex-end' : 'flex-start'} maxW="85%" bg={mine ? 'ink.900' : 'white'} color={mine ? 'bone.500' : 'ink.900'} px={3} py={2} borderRadius="md" boxShadow={mine ? 'none' : 'card'}>
                    <Text fontSize="sm" whiteSpace="pre-wrap">{m.content}</Text>
                    <Text fontSize="10px" fontFamily="mono" color={mine ? 'bone.400' : 'ink.400'} mt={1}>{timeAgo(m.created_at)}</Text>
                  </Box>
                )
              })}
              <div ref={endRef} />
            </Stack>
          ) : (
            <Stack spacing={0}>
              {crew.map((c) => {
                const unread = unreadFor(c.user_id)
                const last = lastFor(c.user_id)
                return (
                  <HStack key={c.user_id} as="button" type="button" onClick={() => setPartner(c)} px={5} py={3} spacing={3} textAlign="left" w="100%" borderBottom="1px solid" borderColor="bone.200" _hover={{ bg: 'paper2' }} bg={unread ? 'white' : 'transparent'}>
                    <MemberAvatar member={c} size="sm" />
                    <Box flex={1} minW={0}>
                      <HStack justify="space-between"><Text fontWeight={unread ? 700 : 500} fontSize="sm">{c.name}</Text>{last && <Text fontSize="10px" fontFamily="mono" color="ink.400">{timeAgo(last.created_at)}</Text>}</HStack>
                      <Text fontSize="xs" color="ink.500" noOfLines={1}>{last ? last.content : c.online ? 'Backstage now' : c.role}</Text>
                    </Box>
                    {unread > 0 && <Box minW="18px" h="18px" px={1} borderRadius="full" bg="ember.500" color="#161618" fontFamily="mono" fontSize="10px" display="grid" placeItems="center">{unread}</Box>}
                  </HStack>
                )
              })}
              {crew.length === 0 && <Text px={5} py={4} fontSize="sm" color="ink.500">Just you so far. Invite the crew from Settings.</Text>}
            </Stack>
          )}
        </DrawerBody>
        {partner && (
          <DrawerFooter borderTop="1px solid" borderColor="bone.200" gap={2} alignItems="flex-end">
            <Textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Note for ${partner.name.split(' ')[0]}`} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} bg="white" />
            <Button onClick={send} isLoading={sending} leftIcon={<FiSend />} flexShrink={0}>Send</Button>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
