import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
  Skeleton,
  Switch,
  Tab,
  TabList,
  Tabs,
  Tag,
  Text,
  Tooltip,
  useDisclosure,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { FiArrowLeft, FiArrowRight, FiExternalLink, FiTrash2, FiUpload } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import TagsInput from '../../components/common/TagsInput'
import { createShowcaseItem, deleteShowcaseItem, listShowcase, PLACEMENTS, reorderShowcase, updateShowcaseItem } from '../../lib/api/showcase'
import { uploadShowcaseImage } from '../../lib/api/storage'

const ACCENTS = ['#FF6A13', '#2BB3A3', '#C6F135', '#F2EDE4', '#0B0B0C', '#8B1E2D', '#4F5A3C']

/** One tile: image, live-editable caption fields, accent, reorder, active, delete. */
function ShowcaseTile({ item, index, total, onPatch, onMove, onDelete, dragging, onDragStart, onDragOver, onDrop }) {
  const [draft, setDraft] = useState(item)
  useEffect(() => setDraft(item), [item])

  const commit = (field) => {
    if (draft[field] !== item[field]) onPatch(item.id, { [field]: draft[field] === '' ? null : draft[field] })
  }
  const field = (name, placeholder, props = {}) => (
    <Input
      size="xs"
      variant="flushed"
      value={draft[name] ?? ''}
      placeholder={placeholder}
      onChange={(e) => setDraft((d) => ({ ...d, [name]: e.target.value }))}
      onBlur={() => commit(name)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      {...props}
    />
  )

  return (
    <Box
      bg="white"
      borderRadius="base"
      boxShadow="card"
      overflow="hidden"
      opacity={item.is_active ? 1 : 0.6}
      outline={dragging === item.id ? '2px solid #FF6A13' : 'none'}
      draggable
      onDragStart={() => onDragStart(item.id)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(item.id)
      }}
      onDrop={(e) => {
        e.preventDefault()
        onDrop(item.id)
      }}
      cursor="grab"
    >
      <Box position="relative" pt="72%" bg="paper2">
        <Image src={item.image_url} alt={item.alt || ''} position="absolute" inset={0} w="full" h="full" objectFit="cover" draggable={false} />
        <Box position="absolute" left={0} right={0} bottom={0} h="4px" bg={item.accent_hex || 'transparent'} />
        <HStack position="absolute" top={2} left={2} spacing={1}>
          <Tag size="sm" bg="rgba(11,11,12,0.7)" color="bone.500" fontFamily="mono" fontSize="10px">
            #{index + 1}
          </Tag>
          {item.width && item.height && (
            <Tag size="sm" bg="rgba(11,11,12,0.7)" color="bone.400" fontFamily="mono" fontSize="10px">
              {item.width}×{item.height}
            </Tag>
          )}
        </HStack>
        <HStack position="absolute" top={2} right={2} spacing={0.5} bg="rgba(255,255,255,0.9)" borderRadius="sm" p={0.5}>
          <IconButton size="xs" variant="ghost" aria-label="Move earlier" icon={<FiArrowLeft />} onClick={() => onMove(index, -1)} isDisabled={index === 0} />
          <IconButton size="xs" variant="ghost" aria-label="Move later" icon={<FiArrowRight />} onClick={() => onMove(index, 1)} isDisabled={index === total - 1} />
        </HStack>
      </Box>
      <Box p={3}>
        <Grid templateColumns="1fr 64px" gap={2} mb={1}>
          {field('client_name', 'Client name', { fontWeight: 600 })}
          {field('year', 'Year', { fontFamily: 'mono', type: 'number', min: 1985, max: 2100 })}
        </Grid>
        {field('title', 'Title / piece')}
        {field('alt', 'Alt text for screen readers', { color: 'ink.500' })}
        <Box mt={2}>
          <TagsInput value={item.tags || []} onChange={(tags) => onPatch(item.id, { tags })} placeholder="tags" />
        </Box>
        <HStack mt={3} justify="space-between" align="center">
          <HStack spacing={1}>
            {ACCENTS.map((hex) => (
              <Tooltip key={hex} label={hex} fontSize="xs">
                <Box as="button" type="button" aria-label={`Accent ${hex}`} w="16px" h="16px" borderRadius="full" bg={hex} border="2px solid" borderColor={item.accent_hex === hex ? 'ink.900' : 'white'} boxShadow="0 0 0 1px #D9D2C5" onClick={() => onPatch(item.id, { accent_hex: hex })} />
              </Tooltip>
            ))}
            <Input type="color" size="xs" w="22px" h="18px" p={0} border="none" value={item.accent_hex || '#FF6A13'} onChange={(e) => onPatch(item.id, { accent_hex: e.target.value })} aria-label="Custom accent" />
          </HStack>
          <HStack spacing={1}>
            <Tooltip label={item.is_active ? 'Showing on the site' : 'Hidden'} fontSize="xs">
              <Box>
                <Switch size="sm" isChecked={item.is_active} onChange={(e) => onPatch(item.id, { is_active: e.target.checked })} aria-label="Toggle visible" />
              </Box>
            </Tooltip>
            {item.image_url && <IconButton as="a" href={item.image_url} target="_blank" rel="noreferrer" size="xs" variant="ghost" aria-label="Open image" icon={<FiExternalLink />} />}
            <IconButton size="xs" variant="ghost" colorScheme="red" aria-label="Delete item" icon={<FiTrash2 />} onClick={() => onDelete(item)} />
          </HStack>
        </HStack>
      </Box>
    </Box>
  )
}

export default function Showcase() {
  const [params, setParams] = useSearchParams()
  const placement = params.get('placement') || 'home'
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
      setItems(await listShowcase(placement))
    } catch (err) {
      setError(err.message)
    }
  }, [placement])

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
        const { path, url, width, height } = await uploadShowcaseImage(file, placement)
        const item = await createShowcaseItem({
          placement,
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

  const tabIndex = Math.max(0, PLACEMENTS.findIndex((p) => p.key === placement))
  const current = PLACEMENTS[tabIndex]

  return (
    <MotionFade>
      <PageHeader eyebrow="Storefront" title="The wall" description="The graphics wall, work gallery and hero images customers see. Drop photos in, caption them, drag to reorder." />

      <Tabs
        index={tabIndex}
        onChange={(i) => {
          const next = new URLSearchParams(params)
          if (PLACEMENTS[i].key === 'home') next.delete('placement')
          else next.set('placement', PLACEMENTS[i].key)
          setParams(next, { replace: true })
        }}
        size="sm"
        mb={4}
      >
        <TabList>
          {PLACEMENTS.map((p) => (
            <Tab key={p.key} fontSize="xs" px={3}>
              {p.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

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
            <Text fontWeight={600}>Drop photos here to add them to the {current.label.toLowerCase()}</Text>
            <Text fontSize="sm" color="ink.500" mt={1}>
              {current.help} Multiple files become multiple tiles. We read the dimensions so the storefront can lay them out without jumping.
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
          <EmptyState title={`Nothing in the ${current.label.toLowerCase()} yet`} description="Drop a few finished pieces above. The first tile is the first thing customers see." />
        </Card>
      ) : (
        <>
          <HStack mb={3} justify="space-between">
            <Text fontSize="xs" color="ink.500">
              <Mono>{items.filter((i) => i.is_active).length}</Mono> live · <Mono>{items.length}</Mono> total · drag tiles or use the arrows to reorder
            </Text>
            <Wrap spacing={1}>
              {[...new Set(items.flatMap((i) => i.tags || []))].slice(0, 8).map((t) => (
                <WrapItem key={t}>
                  <Tag size="sm" bg="paper2" fontSize="xs">
                    {t}
                  </Tag>
                </WrapItem>
              ))}
            </Wrap>
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
                  dragging={dragging}
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
        body={`“${pendingDelete?.title || pendingDelete?.client_name || 'This image'}” comes off the ${current.label.toLowerCase()} and the file is deleted from storage.`}
        confirmLabel="Remove"
      />
    </MotionFade>
  )
}
