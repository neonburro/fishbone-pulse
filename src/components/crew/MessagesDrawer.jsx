// src/components/crew/MessagesDrawer.jsx
//
// Messages between the crew. Pick a person, the thread between the two of
// you opens. That is the whole idea. New messages arrive live over the
// realtime channel, there is a slow poll behind it as a net. No read
// receipts beyond the unread count, no typing indicator, no groups. It is
// a note left on the press, not Slack.

import { useCallback, useEffect, useRef, useState } from 'react'
import { Box, Button, Drawer, DrawerBody, DrawerCloseButton, DrawerContent, DrawerFooter, DrawerHeader, DrawerOverlay, HStack, IconButton, Stack, Text, Textarea, useToast } from '@chakra-ui/react'
import { FiArrowLeft, FiSend } from 'react-icons/fi'
import { listCrew, listConversations, listThread, sendMessage, markThreadRead, subscribeMessages } from '../../lib/api/crew'
import { useAuth } from '../../hooks/useAuth'
import MemberAvatar from './MemberAvatar'
import { timeAgo } from '../../utils/format'

const POLL = 60 * 1000

function dayLabel(iso) {
  const d = new Date(iso); const today = new Date()
  const same = d.toDateString() === today.toDateString()
  const y = new Date(today); y.setDate(today.getDate() - 1)
  if (same) return 'Today'
  if (d.toDateString() === y.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

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
  const inputRef = useRef(null)

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
    const refresh = () => { loadList().catch(() => {}); loadThread().catch(() => {}) }
    const off = subscribeMessages(me, refresh)
    const t = setInterval(refresh, POLL)
    return () => { off(); clearInterval(t) }
  }, [isOpen, me, loadList, loadThread])
  useEffect(() => { loadThread().catch(() => {}) }, [loadThread])
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [thread.length, partner])
  useEffect(() => { if (partner) setTimeout(() => inputRef.current?.focus(), 50) }, [partner])

  const send = async () => {
    if (!text.trim() || !partner) return
    setSending(true)
    try {
      const m = await sendMessage(me, partner.user_id, text)
      setText('')
      setThread((t) => [...t, m])
    } catch (err) {
      toast({ title: 'Not sent', description: err.message, status: 'error' })
    } finally {
      setSending(false)
    }
  }

  const convoFor = (id) => convos.find((c) => c.partnerId === id)
  const people = [...crew].sort((a, b) => (convoFor(b.user_id)?.unread || 0) - (convoFor(a.user_id)?.unread || 0) || Number(b.online) - Number(a.online) || String(a.name).localeCompare(String(b.name)))

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size="sm">
      <DrawerOverlay />
      <DrawerContent bg="paper">
        <DrawerCloseButton />
        <DrawerHeader pb={3}>
          {partner ? (
            <HStack spacing={3}>
              <IconButton aria-label="All crew" icon={<FiArrowLeft />} size="sm" variant="ghost" onClick={() => setPartner(null)} />
              <MemberAvatar member={partner} size="sm" />
              <Box>
                <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" lineHeight={1}>{partner.name}</Text>
                <Text fontSize="xs" color={partner.online ? 'ember.600' : 'ink.500'} mt={0.5}>{partner.online ? 'Backstage now' : partner.last_seen_at ? `Seen ${timeAgo(partner.last_seen_at)}` : 'Not seen yet'}</Text>
              </Box>
            </HStack>
          ) : (
            <>
              <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ember.500">Crew</Text>
              <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" fontSize="xl" lineHeight={1} mt={1}>Pick a person</Text>
            </>
          )}
        </DrawerHeader>
        <DrawerBody px={0}>
          {partner ? (
            <Stack spacing={1.5} px={5} py={2}>
              {thread.length === 0 && <Text fontSize="sm" color="ink.500" py={6} textAlign="center">Nothing yet. Leave {partner.name.split(' ')[0]} a note.</Text>}
              {thread.map((m, i) => {
                const mine = m.sender_id === me
                const newDay = i === 0 || dayLabel(m.created_at) !== dayLabel(thread[i - 1].created_at)
                return (
                  <Box key={m.id} display="contents">
                    {newDay && <Text alignSelf="center" fontFamily="mono" fontSize="10px" letterSpacing="0.14em" textTransform="uppercase" color="ink.400" py={2}>{dayLabel(m.created_at)}</Text>}
                    <Box alignSelf={mine ? 'flex-end' : 'flex-start'} maxW="82%" bg={mine ? 'ink.900' : 'white'} color={mine ? 'bone.500' : 'ink.900'} px={3} py={2} borderRadius="md" borderBottomRightRadius={mine ? '4px' : 'md'} borderBottomLeftRadius={mine ? 'md' : '4px'} boxShadow={mine ? 'none' : 'card'}>
                      <Text fontSize="sm" whiteSpace="pre-wrap">{m.content}</Text>
                      <Text fontSize="10px" fontFamily="mono" color={mine ? 'bone.400' : 'ink.400'} mt={1} textAlign={mine ? 'right' : 'left'}>{new Date(m.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</Text>
                    </Box>
                  </Box>
                )
              })}
              <div ref={endRef} />
            </Stack>
          ) : (
            <Stack spacing={0}>
              {people.map((c) => {
                const v = convoFor(c.user_id)
                const unread = v?.unread || 0
                return (
                  <HStack key={c.user_id} as="button" type="button" onClick={() => setPartner(c)} px={5} py={3} spacing={3} textAlign="left" w="100%" borderBottom="1px solid" borderColor="bone.200" _hover={{ bg: 'white' }} bg={unread ? 'white' : 'transparent'} transition="background 160ms">
                    <MemberAvatar member={c} size="sm" />
                    <Box flex={1} minW={0}>
                      <HStack justify="space-between" align="baseline">
                        <Text fontWeight={unread ? 700 : 500} fontSize="sm" noOfLines={1}>{c.name}</Text>
                        {v?.last && <Text fontSize="10px" fontFamily="mono" color="ink.400" flexShrink={0}>{timeAgo(v.last.created_at)}</Text>}
                      </HStack>
                      <Text fontSize="xs" color={unread ? 'ink.900' : 'ink.500'} noOfLines={1}>{v?.last ? `${v.last.sender_id === me ? 'You: ' : ''}${v.last.content}` : c.online ? 'Backstage now' : `${c.role}, seen ${c.last_seen_at ? timeAgo(c.last_seen_at) : 'never'}`}</Text>
                    </Box>
                    {unread > 0 && <Box minW="18px" h="18px" px={1} borderRadius="full" bg="ember.500" color="#161618" fontFamily="mono" fontSize="10px" fontWeight={700} display="grid" placeItems="center">{unread}</Box>}
                  </HStack>
                )
              })}
              {people.length === 0 && <Text px={5} py={6} fontSize="sm" color="ink.500" textAlign="center">Just you so far. Invite the crew from Settings, Team.</Text>}
            </Stack>
          )}
        </DrawerBody>
        {partner && (
          <DrawerFooter borderTop="1px solid" borderColor="bone.200" gap={2} alignItems="flex-end">
            <Textarea ref={inputRef} rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder={`Note for ${partner.name.split(' ')[0]}. Enter sends, Shift+Enter for a new line.`} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} bg="white" resize="none" />
            <IconButton aria-label="Send" icon={<FiSend />} onClick={send} isLoading={sending} isDisabled={!text.trim()} flexShrink={0} />
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  )
}
