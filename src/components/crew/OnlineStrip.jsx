// src/components/crew/OnlineStrip.jsx
//
// Who is backstage right now. Faces with green dots, in the top bar.
// Tap a face to open a message to them. Refreshes every minute.

import { useEffect, useState } from 'react'
import { HStack, Text } from '@chakra-ui/react'
import { listCrew } from '../../lib/api/crew'
import MemberAvatar from './MemberAvatar'

export default function OnlineStrip({ currentUserId, onPick }) {
  const [crew, setCrew] = useState([])
  useEffect(() => {
    let alive = true
    const load = () => listCrew().then((c) => alive && setCrew(c)).catch(() => {})
    load()
    const t = setInterval(load, 60 * 1000)
    return () => { alive = false; clearInterval(t) }
  }, [])
  const online = crew.filter((c) => c.online && c.user_id !== currentUserId)
  if (!online.length) return <Text fontFamily="mono" fontSize="11px" letterSpacing="0.14em" textTransform="uppercase" color="ink.300">Nobody else backstage</Text>
  return (
    <HStack spacing={1.5}>
      {online.map((m) => <MemberAvatar key={m.user_id} member={m} size="xs" onClick={() => onPick?.(m)} />)}
      <Text fontFamily="mono" fontSize="11px" letterSpacing="0.14em" textTransform="uppercase" color="ink.400" pl={1}>{online.length === 1 ? `${online[0].name.split(' ')[0]} is in` : `${online.length} in`}</Text>
    </HStack>
  )
}
