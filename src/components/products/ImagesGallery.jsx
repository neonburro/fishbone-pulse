import { useRef, useState } from 'react'
import { Box, Button, HStack, IconButton, Image, Input, SimpleGrid, Text, useToast } from '@chakra-ui/react'
import { FiArrowLeft, FiArrowRight, FiStar, FiTrash2, FiUpload } from 'react-icons/fi'
import { removeProductImage, storagePathFromUrl, uploadProductImage } from '../../lib/api/storage'

/**
 * products.images jsonb editor: [{url, alt}]. Upload many, set alt, reorder, remove.
 */
export default function ImagesGallery({ value = [], onChange, productId }) {
  const ref = useRef()
  const [busy, setBusy] = useState(0)
  const toast = useToast()

  const pick = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (!files.length) return
    setBusy(files.length)
    const added = []
    for (const file of files) {
      try {
        const { url } = await uploadProductImage(file, productId)
        added.push({ url, alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ') })
      } catch (err) {
        toast({ title: `Could not upload ${file.name}`, description: err.message, status: 'error' })
      } finally {
        setBusy((b) => b - 1)
      }
    }
    if (added.length) onChange([...value, ...added])
  }

  const update = (i, patch) => onChange(value.map((img, idx) => (idx === i ? { ...img, ...patch } : img)))
  const remove = async (i) => {
    const img = value[i]
    onChange(value.filter((_, idx) => idx !== i))
    const path = storagePathFromUrl(img.url)
    if (path) await removeProductImage(path)
  }
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }
  const makePrimary = (i) => {
    if (i === 0) return
    const next = [...value]
    const [img] = next.splice(i, 1)
    onChange([img, ...next])
  }

  return (
    <Box>
      <Text fontSize="sm" color="ink.500" mb={3}>
        The first image is the primary shot used on the shop grid. Alt text helps search and screen readers.
      </Text>
      {value.length > 0 && (
        <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={3} mb={3}>
          {value.map((img, i) => (
            <Box key={img.url} bg="white" border="1px solid" borderColor={i === 0 ? 'ember.500' : 'bone.200'} borderRadius="base" overflow="hidden">
              <Box position="relative" pt="100%" bg="paper2">
                <Image src={img.url} alt={img.alt || ''} position="absolute" inset={0} w="full" h="full" objectFit="cover" />
                {i === 0 && (
                  <Box position="absolute" top={1} left={1} bg="ember.500" color="white" fontFamily="heading" fontSize="10px" px={1.5} py={0.5} borderRadius="sm" letterSpacing="0.08em" textTransform="uppercase">
                    Primary
                  </Box>
                )}
              </Box>
              <Box p={2}>
                <Input size="xs" value={img.alt || ''} placeholder="Alt text" onChange={(e) => update(i, { alt: e.target.value })} />
                <HStack mt={1.5} spacing={0} justify="space-between">
                  <HStack spacing={0}>
                    <IconButton size="xs" variant="ghost" aria-label="Move left" icon={<FiArrowLeft />} onClick={() => move(i, -1)} isDisabled={i === 0} />
                    <IconButton size="xs" variant="ghost" aria-label="Move right" icon={<FiArrowRight />} onClick={() => move(i, 1)} isDisabled={i === value.length - 1} />
                    <IconButton size="xs" variant="ghost" aria-label="Make primary" icon={<FiStar />} onClick={() => makePrimary(i)} isDisabled={i === 0} />
                  </HStack>
                  <IconButton size="xs" variant="ghost" colorScheme="red" aria-label="Remove image" icon={<FiTrash2 />} onClick={() => remove(i)} />
                </HStack>
              </Box>
            </Box>
          ))}
        </SimpleGrid>
      )}
      <input ref={ref} type="file" accept="image/*" multiple hidden onChange={pick} />
      <Button size="sm" variant="outline" leftIcon={<FiUpload />} onClick={() => ref.current?.click()} isLoading={busy > 0} loadingText={`Uploading ${busy}…`}>
        Upload images
      </Button>
    </Box>
  )
}
