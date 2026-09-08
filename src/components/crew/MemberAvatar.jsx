// src/components/crew/MemberAvatar.jsx
//
// One crew member as a face. Photo if they picked one, initials if not,
// and a green dot when they were seen in the last five minutes.

import { Avatar, Box, Tooltip } from '@chakra-ui/react'
import { isOnline } from '../../lib/api/crew'

const DOT = { xs: '8px', sm: '10px', md: '12px', lg: '14px' }

export default function MemberAvatar({ member, size = 'sm', presence = true, onClick, label, ...rest }) {
  if (!member) return null
  const online = presence && (member.online ?? isOnline(member.last_seen_at))
  const name = member.name || member.display_name || member.username || ''
  const node = (
    <Box position="relative" display="inline-block" cursor={onClick ? 'pointer' : 'default'} onClick={onClick} {...rest}>
      <Avatar size={size} name={name} src={member.avatar_url || undefined} bg="ember.500" color="#161618" fontWeight={700} />
      {presence && (
        <Box position="absolute" bottom="-1px" right="-1px" w={DOT[size] || DOT.sm} h={DOT[size] || DOT.sm} borderRadius="full" bg={online ? '#3DB56B' : 'bone.300'} border="2px solid" borderColor="paper" />
      )}
    </Box>
  )
  return label || name ? <Tooltip label={label || name} hasArrow openDelay={200}>{node}</Tooltip> : node
}
