// src/pages/Settings/DesignTab.jsx
//
// The shop picks the default ink for the storefront. Registration red is
// the brand and the default. The other three are on the shelf for visitors
// to try from the footer, and the shop can close that shelf here so the
// site stays on one color. The list of inks lives in src/theme/accents.js
// and must match the storefront's copy.

import { Box, FormControl, FormLabel, HStack, Stack, Switch, Text, Wrap, WrapItem } from '@chakra-ui/react'
import Card from '../../components/common/Card'
import SaveBar from './SaveBar'
import { useSection } from './useSection'
import { ACCENTS, scaleFrom } from '../../theme/accents'

export default function DesignTab({ settings, onSaved }) {
  const { draft, set, save, saving, dirty } = useSection(settings, 'design', 'Design', onSaved)
  const accent = draft.accent || 'red'
  const switcher = draft.switcher !== false
  return (
    <Stack spacing={5}>
      <Card title="Default ink">
        <Text fontSize="sm" color="ink.500" mb={4}>The accent color the storefront opens with. The eye in the logo, the buttons, the links. Ink and Bone stay the same in every case.</Text>
        <Wrap spacing={3}>
          {ACCENTS.map((a) => {
            const on = a.key === accent
            const s = scaleFrom(a.base)
            return (
              <WrapItem key={a.key}>
                <Box as="button" type="button" onClick={() => set({ accent: a.key })} aria-pressed={on} textAlign="left" bg="white" border="2px solid" borderColor={on ? a.base : 'bone.200'} borderRadius="lg" p={3} w="200px" _hover={{ borderColor: on ? a.base : 'bone.300' }}>
                  <HStack spacing={3} align="flex-start">
                    <Box w="44px" h="44px" borderRadius="10px" bg={a.base} flexShrink={0} boxShadow={`inset 0 0 0 1px ${s[700]}`} />
                    <Box>
                      <Text fontFamily="heading" fontWeight={600} textTransform="uppercase" lineHeight={1}>{a.name}</Text>
                      <Text fontFamily="mono" fontSize="11px" color="ink.500" mt={1}>{a.base}</Text>
                      <Text fontSize="xs" color="ink.500" mt={1}>{a.note}</Text>
                    </Box>
                  </HStack>
                </Box>
              </WrapItem>
            )
          })}
        </Wrap>
      </Card>
      <Card title="The shelf">
        <FormControl display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <FormLabel mb={0}>Let visitors pick an ink</FormLabel>
            <Text fontSize="xs" color="ink.500" mt={1}>Shows the four colors in the footer next to Ink and Bone. Their pick stays in their browser. Off, and the site holds the default.</Text>
          </Box>
          <Switch isChecked={switcher} onChange={(e) => set({ switcher: e.target.checked })} colorScheme="orange" />
        </FormControl>
      </Card>
      <SaveBar onSave={save} saving={saving} dirty={dirty} />
    </Stack>
  )
}
