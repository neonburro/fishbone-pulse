// src/pages/Settings/WebsiteTab.jsx
//
// The shop's hands on the storefront. The stripe across the top of every
// page, on or off, what it says, and whether it wears the accent or stays
// ink. Then the inks themselves, the default and the shelf. More of the
// site lands here as it opens up: the opener, the doors, the wall.

import { Box, FormControl, FormHelperText, FormLabel, HStack, Input, Stack, Switch, Text } from '@chakra-ui/react'
import Card from '../../components/common/Card'
import SaveBar from './SaveBar'
import { useSection } from './useSection'
import { ACCENTS } from '../../theme/accents'
import DesignTab from './DesignTab'

function StripeCard({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'announcement', 'The stripe', onSaved)
  const accent = ACCENTS.find((a) => a.key === (settings?.design?.accent || 'red')) || ACCENTS[0]
  const tone = draft.tone === 'ink' ? 'ink' : 'accent'
  return (
    <Card title="The stripe">
      <Stack spacing={4}>
        <Text fontSize="sm" color="ink.500">The thin line across the top of every page on the site. One sentence, the thing the shop wants said this month.</Text>
        <FormControl display="flex" alignItems="center" justifyContent="space-between" maxW="480px">
          <Box><FormLabel mb={0}>Show it</FormLabel><Text fontSize="xs" color="ink.500">Off, and the site starts at the logo.</Text></Box>
          <Switch isChecked={Boolean(draft.enabled)} onChange={(e) => set({ enabled: e.target.checked })} colorScheme="orange" />
        </FormControl>
        <FormControl maxW="640px">
          <FormLabel>What it says</FormLabel>
          <Input value={draft.text || ''} onChange={(e) => set({ text: e.target.value })} placeholder="Festival season is here. Book your merch run early." maxLength={140} bg="white" />
          <FormHelperText color="ink.300">{(draft.text || '').length} of 140. Short reads better.</FormHelperText>
        </FormControl>
        <FormControl display="flex" alignItems="center" justifyContent="space-between" maxW="480px">
          <Box><FormLabel mb={0}>Wear the accent</FormLabel><Text fontSize="xs" color="ink.500">On, the stripe is the site's ink, {accent.name} today. Off, it stays quiet on black.</Text></Box>
          <Switch isChecked={tone === 'accent'} onChange={(e) => set({ tone: e.target.checked ? 'accent' : 'ink' })} colorScheme="orange" />
        </FormControl>
        <Box>
          <Text fontFamily="mono" fontSize="11px" letterSpacing="0.16em" textTransform="uppercase" color="ink.500" mb={2}>How it looks</Text>
          <Box borderRadius="md" overflow="hidden" border="1px solid" borderColor="bone.200">
            <Box bg={tone === 'accent' ? accent.base : '#1D1D20'} color={tone === 'accent' ? accent.on : '#CFC9BE'} px={4} py="6px" fontFamily="mono" fontSize="11px" letterSpacing="0.14em" textTransform="uppercase" opacity={draft.enabled ? 1 : 0.35}>
              {draft.text || 'Nothing yet'}
            </Box>
            <HStack bg="#161618" px={4} py={3} spacing={3}><Box w="90px" h="14px" borderRadius="sm" bg="#EFEAE0" opacity={0.85} /><Box flex={1} /><Box w="160px" h="10px" borderRadius="full" bg="#2C2F35" /></HStack>
          </Box>
        </Box>
        <SaveBar onSave={save} saving={saving} dirty={dirty} />
      </Stack>
    </Card>
  )
}

export default function WebsiteTab({ settings, onSaved }) {
  return (
    <Stack spacing={5}>
      <StripeCard settings={settings} onSaved={onSaved} />
      <DesignTab settings={settings} onSaved={onSaved} />
    </Stack>
  )
}
