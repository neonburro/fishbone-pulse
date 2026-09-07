import { useState } from 'react'
import { Box, Button, HStack, Text, useToast, VStack } from '@chakra-ui/react'
import { FiExternalLink, FiFile, FiImage } from 'react-icons/fi'
import { signedArtworkUrl } from '../../lib/api/storage'
import { formatBytes } from '../../utils/format'

/**
 * Customer artwork lives in the private 'artwork' bucket; we mint a signed URL on click.
 * @param {Array<{path:string,name:string,size:number,type:string}>} files
 */
export default function ArtworkList({ files = [], compact = false }) {
  const [busy, setBusy] = useState(null)
  const toast = useToast()

  if (!files?.length) {
    return (
      <Text fontSize="xs" color="ink.300">
        No artwork attached
      </Text>
    )
  }

  const open = async (file) => {
    setBusy(file.path)
    try {
      const url = await signedArtworkUrl(file.path)
      window.open(url, '_blank', 'noopener')
    } catch (err) {
      toast({ title: 'Could not open artwork', description: err.message, status: 'error' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <VStack align="stretch" spacing={1.5}>
      {files.map((f) => (
        <HStack key={f.path} spacing={2} bg="paper2" px={2} py={1.5} borderRadius="sm" justify="space-between">
          <HStack spacing={2} minW={0}>
            <Box as={f.type?.startsWith('image/') ? FiImage : FiFile} color="ink.500" flexShrink={0} />
            <Text fontSize="xs" noOfLines={1} fontFamily="mono">
              {f.name || f.path.split('/').pop()}
            </Text>
            {!compact && f.size && (
              <Text fontSize="xs" color="ink.300" whiteSpace="nowrap">
                {formatBytes(f.size)}
              </Text>
            )}
          </HStack>
          <Button size="xs" variant="outline" rightIcon={<FiExternalLink />} onClick={() => open(f)} isLoading={busy === f.path}>
            Open
          </Button>
        </HStack>
      ))}
    </VStack>
  )
}
