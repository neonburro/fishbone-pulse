import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Box,
  Button,
  Grid,
  HStack,
  IconButton,
  Image,
  Input,
  Progress,
  SimpleGrid,
  Stack,
  Skeleton,
  Switch,
  Tag,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { FiArrowLeft, FiArrowRight, FiEye, FiEyeOff, FiTrash2, FiUpload } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import { createShowcaseItem, deleteShowcaseItem, listShowcase, reorderShowcase, updateShowcaseItem } from '../../lib/api/showcase'
import { uploadShowcaseImage } from '../../lib/api/storage'


/** One tile. The photo, one caption, a Home switch, delete. Drag to reorder. */
function ShowcaseTile({ item, index, total, onPatch, onMove, onDelete, dragging, onDragStart, onDragOver, onDrop }) {
  const [caption, setCaption] = useState(item.client_name || item.title || '')
  useEffect(() => setCaption(item.client_name || item.title || ''), [item.client_name, item.title])
  const commit = () => {
    const next = caption.trim()
    if (next !== (item.client_name || item.title || '')) onPatch(item.id, { client_name: next || null, alt: next || null })
  }
  return (
    <Box
      bg="white"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="card"
      opacity={item.is_active ? 1 : 0.5}
      outline={dragging ? '2px solid' : 'none'}
      outlineColor="ember.500"
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={(e) => { e.preventDefault(); onDragOver(item.id) }}
      onDrop={() => onDrop(item.id)}
      cursor="grab"
    >
      <Box position="relative" bg="paper2" pt="100%">
        {item.image_url ? (
          <Image src={item.image_url} alt={item.alt || ''} position="absolute" inset={0} w="100%" h="100%" objectFit="cover" />
        ) : (
          <Text position="absolute" inset={0} display="grid" placeItems="center" fontFamily="mono" fontSize="11px" color="ink.400">No photo</Text>
        )}
        <Text position="absolute" top={2} left={2} fontFamily="mono" fontSize="10px" px={1.5} py={0.5} borderRadius="sm" bg="rgba(22,22,24,0.7)" color="bone.500">{index + 1}</Text>
        <HStack position="absolute" top={2} right={2} spacing={0}>
          <IconButton size="xs" variant="solid" bg="rgba(22,22,24,0.7)" color="bone.500" _hover={{ bg: 'ink.900' }} aria-label="Move earlier" icon={<FiArrowLeft />} onClick={() => onMove(index, -1)} isDisabled={index === 0} />
          <IconButton size="xs" variant="solid" bg="rgba(22,22,24,0.7)" color="bone.500" _hover={{ bg: 'ink.900' }} aria-label="Move later" icon={<FiArrowRight />} onClick={() => onMove(index, 1)} isDisabled={index === total - 1} ml={1} />
        </HStack>
      </Box>
      <Stack spacing={2} p={3}>
        <Input size="sm" variant="flushed" value={caption} placeholder="Who it was for" onChange={(e) => setCaption(e.target.value)} onBlur={commit} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} />
        <HStack justify="space-between">
          <HStack spacing={2}>
            <Switch size="sm" colorScheme="orange" isChecked={item.placement === 'home'} onChange={(e) => onPatch(item.id, { placement: e.target.checked ? 'home' : 'work' })} aria-label="Show on the home page" />
            <Text fontSize="xs" color="ink.500">{item.placement === 'home' ? 'Home page too' : 'Work page only'}</Text>
          </HStack>
          <HStack spacing={0}>
            <Tooltip label={item.is_active ? 'Hide from the site' : 'Show on the site'} fontSize="xs">
              <IconButton size="xs" variant="ghost" aria-label={item.is_active ? 'Hide' : 'Show'} icon={item.is_active ? <FiEye /> : <FiEyeOff />} onClick={() => onPatch(item.id, { is_active: !item.is_active })} />
            </Tooltip>
            <IconButton size="xs" variant="ghost" color="ink.500" aria-label="Delete photo" icon={<FiTrash2 />} onClick={() => onDelete(item)} />
          </HStack>
        </HStack>
      </Stack>
    </Box>
  )
}

export default function Showcase() {
  const toast = useToast()
  const del = useDisclosure()
  const inputRef = useRef()
  const [items, setItems] = useState(null)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState({ done: 0, total: 0 })
  const [dragging, setDragging] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [dropHover, setDropHover] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      setItems(await listShowcase())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    setItems(null)
    load()
  }, [load])

  const fail = (title, err) => toast({ title, description: err.message, status: 'error' })

  const patch = async (id, fields) => {
    setItems((list) => list.map((it) => (it.id === id ? { ...it, ...fields } : it)))
    try {
      await updateShowcaseItem(id, fields)
    } catch (err) {
      fail('Could not save change', err)
      load()
    }
  }

  const persistOrder = async (next) => {
    setItems(next)
    try {
      await reorderShowcase(next)
    } catch (err) {
      fail('Could not reorder', err)
      load()
    }
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const next = [...items]
    ;[next[i], next[j]] = [next[j], next[i]]
    persistOrder(next)
  }

  const onDrop = (targetId) => {
    if (!dragging || dragging === targetId) return setDragging(null)
    const from = items.findIndex((x) => x.id === dragging)
    const to = items.findIndex((x) => x.id === targetId)
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    setDragging(null)
    setDropTarget(null)
    persistOrder(next)
  }

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((f) => f.type.startsWith('image/'))
    if (!files.length) return toast({ title: 'Drop image files', description: 'JPG, PNG or WebP.', status: 'warning' })
    setUploading({ done: 0, total: files.length })
    let order = items?.length || 0
    const created = []
    for (const file of files) {
      try {
        const { path, url, width, height } = await uploadShowcaseImage(file, 'wall')
        const item = await createShowcaseItem({
          placement: 'home',
          image_path: path,
          image_url: url,
          width,
          height,
          alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
          sort_order: order++,
          is_active: true,
          accent_hex: '#FF6A13',
        })
        created.push(item)
      } catch (err) {
        fail(`Could not upload ${file.name}`, err)
      } finally {
        setUploading((u) => ({ ...u, done: u.done + 1 }))
      }
    }
    if (created.length) {
      setItems((list) => [...(list || []), ...created])
      toast({ title: `Added ${created.length} image${created.length === 1 ? '' : 's'}`, description: 'Fill in client, year and alt text on each tile.', status: 'success' })
    }
    setUploading({ done: 0, total: 0 })
  }

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteShowcaseItem(pendingDelete)
      setItems((list) => list.filter((x) => x.id !== pendingDelete.id))
      toast({ title: 'Removed from showcase', status: 'success', duration: 1500 })
      del.onClose()
      setPendingDelete(null)
    } catch (err) {
      fail('Could not delete', err)
    } finally {
      setDeleting(false)
    }
  }


  return (
    <MotionFade>
      <PageHeader eyebrow="Storefront" title="The wall" description="Drop photos in. They show on the Work page, and on the home page too if the switch is on. Drag to reorder, write who it was for, delete what is old." />


      {/* Dropzone */}
      <Box
        mb={5}
        p={5}
        border="2px dashed"
        borderColor={dropHover ? 'ember.500' : 'bone.300'}
        bg={dropHover ? 'ember.50' : 'white'}
        borderRadius="base"
        textAlign="center"
        transition="all 0.15s"
        onDragOver={(e) => {
          e.preventDefault()
          if (!dragging) setDropHover(true)
        }}
        onDragLeave={() => setDropHover(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDropHover(false)
          if (!dragging) uploadFiles(e.dataTransfer.files)
        }}
      >
        <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => uploadFiles(e.target.files)} />
        {uploading.total > 0 ? (
          <Box maxW="360px" mx="auto">
            <Text fontSize="sm" fontWeight={600} mb={2}>
              Uploading {uploading.done + 1} of {uploading.total}…
            </Text>
            <Progress value={(uploading.done / uploading.total) * 100} size="sm" colorScheme="orange" borderRadius="full" />
          </Box>
        ) : (
          <>
            <Text fontWeight={600}>Drop photos here to add them to the wall</Text>
            <Text fontSize="sm" color="ink.500" mt={1}>
              JPG, PNG or WebP, as many at once as you like. Each one becomes a tile.
            </Text>
            <Button mt={3} size="sm" leftIcon={<FiUpload />} onClick={() => inputRef.current?.click()}>
              Choose images
            </Button>
          </>
        )}
      </Box>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items === null ? (
        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={4}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} h="300px" />
          ))}
        </SimpleGrid>
      ) : items.length === 0 ? (
        <Card p={0}>
          <EmptyState title="Nothing on the wall yet" description="Drop a few finished pieces above. The first tile is the first thing customers see." />
        </Card>
      ) : (
        <>
          <HStack mb={3} justify="space-between">
            <Text fontSize="xs" color="ink.500">
              <Mono>{items.filter((i) => i.placement === 'home' && i.is_active).length}</Mono> on the home page, <Mono>{items.filter((i) => i.is_active).length}</Mono> on the work page. Drag a tile or use its arrows to reorder.
            </Text>
          </HStack>
          <SimpleGrid columns={{ base: 1, sm: 2, lg: 3, xl: 4 }} spacing={4}>
            {items.map((item, i) => (
              <Box key={item.id} outline={dropTarget === item.id && dragging !== item.id ? '2px dashed #2BB3A3' : 'none'} borderRadius="base">
                <ShowcaseTile
                  item={item}
                  index={i}
                  total={items.length}
                  onPatch={patch}
                  onMove={move}
                  onDelete={(it) => {
                    setPendingDelete(it)
                    del.onOpen()
                  }}
                  dragging={dragging === item.id}
                  onDragStart={setDragging}
                  onDragOver={setDropTarget}
                  onDrop={onDrop}
                />
              </Box>
            ))}
          </SimpleGrid>
        </>
      )}

      <ConfirmDialog
        isOpen={del.isOpen}
        onClose={() => {
          del.onClose()
          setPendingDelete(null)
        }}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title="Remove this image?"
        body={`“${pendingDelete?.title || pendingDelete?.client_name || 'This image'}” comes off the wall, home page and work page both, and the file is deleted from storage.`}
        confirmLabel="Remove"
      />
    </MotionFade>
  )
}
