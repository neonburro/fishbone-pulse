import { useCallback, useEffect, useState } from 'react'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Image,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  Tooltip,
} from '@chakra-ui/react'
import { FiArrowDown, FiArrowUp, FiCheck, FiEdit2, FiImage, FiPlus, FiTrash2, FiX } from 'react-icons/fi'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import ConfirmDialog from '../components/common/ConfirmDialog'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import MotionFade from '../components/common/MotionFade'
import TableSkeleton from '../components/common/TableSkeleton'
import ImageUpload from '../components/products/ImageUpload'
import Mono from '../components/common/Mono'
import { createCategory, deleteCategory, listCategories, reorderCategories, updateCategory } from '../lib/api/categories'
import { uploadSiteImage } from '../lib/api/storage'
import { slugify } from '../utils/format'

const uploadCategoryImage = (file, key) => uploadSiteImage(file, `categories/${key || 'misc'}`)

function CategoryRow({ cat, index, total, onMove, onSave, onDelete, onToggle }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(cat)
  const [saving, setSaving] = useState(false)
  const count = cat.products?.[0]?.count ?? 0

  useEffect(() => setDraft(cat), [cat])

  const save = async () => {
    setSaving(true)
    const ok = await onSave(cat.id, {
      name: draft.name.trim(),
      key: draft.key.trim(),
      tagline: draft.tagline?.trim() || null,
      description: draft.description?.trim() || null,
      image_url: draft.image_url || null,
    })
    setSaving(false)
    if (ok) setEditing(false)
  }

  return (
    <Box borderBottom="1px solid" borderColor="bone.200" _last={{ borderBottom: 'none' }} px={4} py={3} bg={editing ? 'paper2' : 'white'}>
      <HStack align="flex-start" spacing={4}>
        <Stack spacing={0} pt={1}>
          <IconButton size="xs" variant="ghost" aria-label="Move up" icon={<FiArrowUp />} onClick={() => onMove(index, -1)} isDisabled={index === 0} />
          <IconButton size="xs" variant="ghost" aria-label="Move down" icon={<FiArrowDown />} onClick={() => onMove(index, 1)} isDisabled={index === total - 1} />
        </Stack>

        {editing ? (
          <Box flex="1">
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input size="sm" value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Key (URL)</FormLabel>
                <Input size="sm" fontFamily="mono" value={draft.key} onChange={(e) => setDraft((d) => ({ ...d, key: slugify(e.target.value) || e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel>Tagline</FormLabel>
                <Input size="sm" value={draft.tagline || ''} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} placeholder="Short line under the category name" />
              </FormControl>
              <FormControl>
                <FormLabel>Image</FormLabel>
                <ImageUpload value={draft.image_url} onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))} productId={draft.key} size="56px" uploader={uploadCategoryImage} />
              </FormControl>
              <FormControl gridColumn={{ md: '1 / -1' }}>
                <FormLabel>Description</FormLabel>
                <Textarea size="sm" rows={2} value={draft.description || ''} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              </FormControl>
            </SimpleGrid>
            <HStack mt={3}>
              <Button size="sm" leftIcon={<FiCheck />} onClick={save} isLoading={saving} isDisabled={!draft.name.trim() || !draft.key.trim()}>
                Save
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<FiX />} onClick={() => setEditing(false)}>
                Cancel
              </Button>
            </HStack>
          </Box>
        ) : (
          <>
            <Box w="56px" h="56px" bg="paper2" borderRadius="sm" overflow="hidden" flexShrink={0} display="flex" alignItems="center" justifyContent="center" color="bone.400">
              {cat.image_url ? <Image src={cat.image_url} alt="" w="full" h="full" objectFit="cover" /> : <FiImage />}
            </Box>
            <Box flex="1" minW={0}>
              <HStack spacing={2}>
                <Text fontWeight={600}>{cat.name}</Text>
                <Mono fontSize="xs" color="ink.500">
                  /shop/{cat.key}
                </Mono>
              </HStack>
              {cat.tagline && (
                <Text fontSize="sm" color="ink.700" noOfLines={1}>
                  {cat.tagline}
                </Text>
              )}
              <Text fontSize="xs" color="ink.500">
                {count} product{count === 1 ? '' : 's'}
              </Text>
            </Box>
            <HStack spacing={1}>
              <Tooltip label={cat.is_active ? 'Visible on the shop' : 'Hidden from the shop'}>
                <Box>
                  <Switch size="sm" isChecked={cat.is_active} onChange={(e) => onToggle(cat, e.target.checked)} aria-label={`Toggle ${cat.name}`} />
                </Box>
              </Tooltip>
              <IconButton size="sm" variant="ghost" aria-label="Edit category" icon={<FiEdit2 />} onClick={() => setEditing(true)} />
              <IconButton size="sm" variant="ghost" colorScheme="red" aria-label="Delete category" icon={<FiTrash2 />} onClick={() => onDelete(cat)} />
            </HStack>
          </>
        )}
      </HStack>
    </Box>
  )
}

export default function Categories() {
  const toast = useToast()
  const add = useDisclosure()
  const [cats, setCats] = useState(null)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', key: '', tagline: '', description: '', image_url: null })
  const [keyTouched, setKeyTouched] = useState(false)

  const load = useCallback(async () => {
    setError('')
    try {
      setCats(await listCategories())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const fail = (title, err) => toast({ title, description: err.message, status: 'error' })

  const onMove = async (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= cats.length) return
    const next = [...cats]
    ;[next[i], next[j]] = [next[j], next[i]]
    setCats(next)
    try {
      await reorderCategories(next)
    } catch (err) {
      fail('Could not reorder', err)
      load()
    }
  }

  const onSave = async (id, patch) => {
    try {
      const updated = await updateCategory(id, patch)
      setCats((c) => c.map((x) => (x.id === id ? { ...x, ...updated } : x)))
      toast({ title: 'Category saved', status: 'success', duration: 1500 })
      return true
    } catch (err) {
      fail('Could not save category', err)
      return false
    }
  }

  const onToggle = async (cat, is_active) => {
    setCats((c) => c.map((x) => (x.id === cat.id ? { ...x, is_active } : x)))
    try {
      await updateCategory(cat.id, { is_active })
    } catch (err) {
      setCats((c) => c.map((x) => (x.id === cat.id ? { ...x, is_active: !is_active } : x)))
      fail('Could not update category', err)
    }
  }

  const onDelete = async () => {
    setDeleting(true)
    try {
      await deleteCategory(pendingDelete.id, pendingDelete.name)
      setCats((c) => c.filter((x) => x.id !== pendingDelete.id))
      toast({ title: `Deleted ${pendingDelete.name}`, status: 'success' })
      setPendingDelete(null)
    } catch (err) {
      fail('Could not delete category', err)
    } finally {
      setDeleting(false)
    }
  }

  const onCreate = async () => {
    setCreating(true)
    try {
      const created = await createCategory({ ...draft, sort_order: cats?.length || 0 })
      setCats((c) => [...(c || []), { ...created, products: [{ count: 0 }] }])
      toast({ title: `Added ${created.name}`, status: 'success' })
      setDraft({ name: '', key: '', tagline: '', description: '', image_url: null })
      setKeyTouched(false)
      add.onClose()
    } catch (err) {
      fail('Could not create category', err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <MotionFade>
      <PageHeader
        eyebrow="Catalog"
        title="Categories"
        description="Shop sections in the order they appear on the storefront. Use the arrows to reorder."
        actions={
          <Button size="sm" leftIcon={<FiPlus />} onClick={add.onOpen}>
            Add category
          </Button>
        }
      />

      <Card p={0}>
        {error ? (
          <Box p={4}>
            <ErrorState message={error} onRetry={load} />
          </Box>
        ) : cats === null ? (
          <TableSkeleton rows={5} height="72px" />
        ) : cats.length === 0 ? (
          <EmptyState title="No categories" description="Create sections like Tees, Hoodies, Hats and Festival Merch to organize the shop." action={<Button size="sm" leftIcon={<FiPlus />} onClick={add.onOpen}>Add category</Button>} />
        ) : (
          cats.map((cat, i) => <CategoryRow key={cat.id} cat={cat} index={i} total={cats.length} onMove={onMove} onSave={onSave} onDelete={setPendingDelete} onToggle={onToggle} />)
        )}
      </Card>

      <Modal isOpen={add.isOpen} onClose={add.onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add category</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <Input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value, ...(keyTouched ? {} : { key: slugify(e.target.value) }) }))} placeholder="Festival Merch" autoFocus />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Key (URL)</FormLabel>
                  <Input
                    fontFamily="mono"
                    value={draft.key}
                    onChange={(e) => {
                      setKeyTouched(true)
                      setDraft((d) => ({ ...d, key: slugify(e.target.value) || e.target.value }))
                    }}
                    placeholder="festival-merch"
                  />
                </FormControl>
              </SimpleGrid>
              <FormControl>
                <FormLabel>Tagline</FormLabel>
                <Input value={draft.tagline} onChange={(e) => setDraft((d) => ({ ...d, tagline: e.target.value }))} placeholder="Tour-grade tees and hoodies for the festival circuit" />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea rows={3} value={draft.description} onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))} />
              </FormControl>
              <FormControl>
                <FormLabel>Image</FormLabel>
                <ImageUpload value={draft.image_url} onChange={(url) => setDraft((d) => ({ ...d, image_url: url }))} productId={draft.key || 'new'} size="72px" uploader={uploadCategoryImage} />
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={add.onClose} mr={2}>
              Cancel
            </Button>
            <Button onClick={onCreate} isLoading={creating} isDisabled={!draft.name.trim() || !draft.key.trim()}>
              Add category
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={onDelete}
        isLoading={deleting}
        title={`Delete ${pendingDelete?.name}?`}
        body={
          (pendingDelete?.products?.[0]?.count ?? 0) > 0
            ? `${pendingDelete.products[0].count} product(s) are in this category. They will become uncategorized (or the delete will be blocked by the database if products must have a category).`
            : 'This category has no products. It will be removed from the shop navigation.'
        }
        confirmLabel="Delete category"
      />
    </MotionFade>
  )
}
