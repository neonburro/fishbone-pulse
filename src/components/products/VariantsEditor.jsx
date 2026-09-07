import { useRef, useState } from 'react'
import {
  Box,
  Button,
  Checkbox,
  HStack,
  IconButton,
  Image,
  Input,
  NumberInput,
  NumberInputField,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
} from '@chakra-ui/react'
import { FiArrowDown, FiArrowUp, FiPlus, FiTrash2, FiUpload, FiX } from 'react-icons/fi'
import { uploadProductImage } from '../../lib/api/storage'

const emptyVariant = () => ({
  _key: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  color_name: '',
  color_hex: '#0B0B0C',
  sku: '',
  price_adjustment: 0,
  in_stock: true,
  image_url: null,
})

function VariantImage({ value, onChange, productId }) {
  const ref = useRef()
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const { url } = await uploadProductImage(file, productId)
      onChange(url)
    } catch (err) {
      toast({ title: 'Upload failed', description: err.message, status: 'error' })
    } finally {
      setBusy(false)
    }
  }
  return (
    <HStack spacing={1}>
      <Box w="40px" h="40px" bg="paper2" borderRadius="sm" border="1px solid" borderColor="bone.300" overflow="hidden" position="relative" flexShrink={0}>
        {value && <Image src={value} alt="" w="full" h="full" objectFit="cover" />}
        {value && <IconButton aria-label="Remove variant image" icon={<FiX />} size="xs" position="absolute" inset={0} m="auto" w="18px" h="18px" minW={0} colorScheme="blackAlpha" opacity={0} _hover={{ opacity: 1 }} onClick={() => onChange(null)} />}
      </Box>
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
      <IconButton aria-label="Upload variant image" icon={<FiUpload />} size="xs" variant="ghost" onClick={() => ref.current?.click()} isLoading={busy} />
    </HStack>
  )
}

/**
 * Color variants table. Each row: color_name, color_hex, sku, price_adjustment, in_stock, image.
 * @param {Array} value
 * @param {(rows: Array) => void} onChange
 */
export default function VariantsEditor({ value = [], onChange, productId }) {
  const update = (i, patch) => onChange(value.map((v, idx) => (idx === i ? { ...v, ...patch } : v)))
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i))
  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= value.length) return
    const next = [...value]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <Box>
      {value.length === 0 ? (
        <Text fontSize="sm" color="ink.500" mb={3}>
          No color variants yet. Add one per garment color you stock — customers pick a color, then enter sizes.
        </Text>
      ) : (
        <Box overflowX="auto" mb={3}>
          <Table size="sm" variant="simple">
            <Thead>
              <Tr>
                <Th w="40px"></Th>
                <Th>Color</Th>
                <Th w="120px">Hex</Th>
                <Th>SKU</Th>
                <Th isNumeric w="130px">
                  Price adj.
                </Th>
                <Th w="90px">In stock</Th>
                <Th w="90px">Image</Th>
                <Th w="120px"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {value.map((v, i) => (
                <Tr key={v.id || v._key}>
                  <Td>
                    <Box w="24px" h="24px" borderRadius="sm" border="1px solid" borderColor="bone.300" bg={v.color_hex || 'transparent'} />
                  </Td>
                  <Td>
                    <Input size="sm" value={v.color_name || ''} placeholder="Heather Charcoal" onChange={(e) => update(i, { color_name: e.target.value })} />
                  </Td>
                  <Td>
                    <HStack spacing={1}>
                      <Input type="color" size="sm" w="36px" p={0.5} value={v.color_hex || '#000000'} onChange={(e) => update(i, { color_hex: e.target.value })} aria-label="Pick color" />
                      <Input size="sm" fontFamily="mono" value={v.color_hex || ''} onChange={(e) => update(i, { color_hex: e.target.value })} placeholder="#0B0B0C" maxLength={7} />
                    </HStack>
                  </Td>
                  <Td>
                    <Input size="sm" fontFamily="mono" value={v.sku || ''} placeholder="G500-HCH" onChange={(e) => update(i, { sku: e.target.value })} />
                  </Td>
                  <Td isNumeric>
                    <NumberInput size="sm" value={v.price_adjustment ?? 0} step={0.25} precision={2} onChange={(_, n) => update(i, { price_adjustment: Number.isNaN(n) ? 0 : n })}>
                      <NumberInputField fontFamily="mono" textAlign="right" />
                    </NumberInput>
                  </Td>
                  <Td>
                    <Checkbox isChecked={v.in_stock !== false} onChange={(e) => update(i, { in_stock: e.target.checked })} />
                  </Td>
                  <Td>
                    <VariantImage value={v.image_url} onChange={(url) => update(i, { image_url: url })} productId={productId} />
                  </Td>
                  <Td>
                    <HStack spacing={0} justify="flex-end">
                      <IconButton size="xs" variant="ghost" aria-label="Move up" icon={<FiArrowUp />} onClick={() => move(i, -1)} isDisabled={i === 0} />
                      <IconButton size="xs" variant="ghost" aria-label="Move down" icon={<FiArrowDown />} onClick={() => move(i, 1)} isDisabled={i === value.length - 1} />
                      <IconButton size="xs" variant="ghost" colorScheme="red" aria-label="Remove variant" icon={<FiTrash2 />} onClick={() => remove(i)} />
                    </HStack>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      <Button size="sm" variant="outline" leftIcon={<FiPlus />} onClick={() => onChange([...value, emptyVariant()])}>
        Add color
      </Button>
    </Box>
  )
}
