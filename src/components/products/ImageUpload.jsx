import { useRef, useState } from 'react'
import { Box, Button, HStack, IconButton, Image, Text, useToast } from '@chakra-ui/react'
import { FiUpload, FiX } from 'react-icons/fi'
import { uploadProductImage } from '../../lib/api/storage'

/**
 * Single-image uploader to the product-images bucket.
 * @param {string|null} value       current public URL
 * @param {(url: string|null, path: string|null) => void} onChange
 * @param {string} productId        used for the storage folder
 */
export default function ImageUpload({ value, onChange, productId, size = '96px', label = 'Upload image', uploader = uploadProductImage }) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef()
  const toast = useToast()

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const { url, path } = await uploader(file, productId)
      onChange(url, path)
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, status: 'error' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <HStack spacing={3} align="center">
      <Box position="relative" w={size} h={size} bg="paper2" borderRadius="base" border="1px dashed" borderColor="bone.300" overflow="hidden" flexShrink={0} display="flex" alignItems="center" justifyContent="center">
        {value ? (
          <>
            <Image src={value} alt="" w="full" h="full" objectFit="cover" />
            <IconButton aria-label="Remove image" icon={<FiX />} size="xs" position="absolute" top={1} right={1} colorScheme="blackAlpha" onClick={() => onChange(null, null)} />
          </>
        ) : (
          <Text fontSize="xs" color="ink.300" textAlign="center" px={1}>
            No image
          </Text>
        )}
      </Box>
      <Box>
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFile} />
        <Button size="sm" variant="outline" leftIcon={<FiUpload />} onClick={() => inputRef.current?.click()} isLoading={uploading} loadingText="Uploading">
          {value ? 'Replace' : label}
        </Button>
        <Text fontSize="xs" color="ink.300" mt={1}>
          JPG, PNG or WebP · under 8 MB
        </Text>
      </Box>
    </HStack>
  )
}
