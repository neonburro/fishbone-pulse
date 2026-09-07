import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import { Box, Button, ButtonGroup, FormControl, FormHelperText, FormLabel, Grid, GridItem, HStack, Input, InputGroup, InputLeftAddon, Skeleton, Stack, Switch, Text, Textarea, useDisclosure, useToast } from '@chakra-ui/react'
import { FiArrowLeft, FiEye, FiEdit3, FiSave, FiTrash2, FiExternalLink } from 'react-icons/fi'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import TagsInput from '../../components/common/TagsInput'
import ImageUpload from '../../components/products/ImageUpload'
import { useAuth } from '../../hooks/useAuth'
import { createPost, deletePost, getPost, postSlugExists, updatePost } from '../../lib/api/posts'
import { uploadJournalCover } from '../../lib/api/storage'
import { STOREFRONT_URL } from '../../lib/constants'
import { slugify, formatDateTime } from '../../utils/format'

const EMPTY = { title: '', slug: '', kicker: '', excerpt: '', body: '', cover_image_path: null, cover_image_url: null, cover_alt: '', tags: [], author_name: '', is_published: false, published_at: null, is_pinned: false }

const uploadCover = (file) => uploadJournalCover(file)

export default function NoteEditor() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const del = useDisclosure()
  const { user, displayName } = useAuth()
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [mode, setMode] = useState('write')
  const [errors, setErrors] = useState({})

  const load = useCallback(async () => {
    if (isNew) return
    setLoadError('')
    try {
      const p = await getPost(id)
      if (!p) return setLoadError('This note does not exist.')
      setForm({ ...EMPTY, ...p, tags: p.tags || [], cover_alt: p.cover_alt || '', kicker: p.kicker || '', excerpt: p.excerpt || '', body: p.body || '' })
      setSlugTouched(true)
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => {
    load()
  }, [load])

  // default author to the signed-in profile for new notes
  useEffect(() => {
    if (isNew && !form.author_name && displayName) setForm((f) => ({ ...f, author_name: displayName }))
  }, [isNew, displayName, form.author_name])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const html = useMemo(() => {
    if (mode !== 'preview') return ''
    return DOMPurify.sanitize(marked.parse(form.body || '', { breaks: true, gfm: true }))
  }, [form.body, mode])

  const save = async () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Give the note a title.'
    if (!form.slug.trim() || !/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Slug: lowercase letters, numbers and dashes.'
    if (!e.slug) {
      try {
        if (await postSlugExists(form.slug, id)) e.slug = 'Another note already uses this slug.'
      } catch {
        /* surface on save */
      }
    }
    setErrors(e)
    if (Object.keys(e).length) return toast({ title: 'Check the form', description: Object.values(e)[0], status: 'warning' })

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim(),
        kicker: form.kicker.trim() || null,
        excerpt: form.excerpt.trim() || null,
        body: form.body,
        cover_image_path: form.cover_image_path || null,
        cover_image_url: form.cover_image_url || null,
        cover_alt: form.cover_alt.trim() || null,
        tags: form.tags,
        author_id: form.author_id || user?.id || null,
        author_name: form.author_name.trim() || displayName,
        is_published: form.is_published,
        published_at: form.is_published ? form.published_at || new Date().toISOString() : form.published_at,
        is_pinned: form.is_pinned,
      }
      if (isNew) {
        const created = await createPost(payload)
        toast({ title: 'Note created', status: 'success', duration: 1500 })
        navigate(`/notes/${created.id}`, { replace: true })
      } else {
        const updated = await updatePost(id, payload)
        setForm((f) => ({ ...f, ...updated, tags: updated.tags || [] }))
        toast({ title: 'Note saved', status: 'success', duration: 1500 })
      }
    } catch (err) {
      toast({ title: 'Could not save note', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await deletePost(id, form.title)
      toast({ title: 'Note deleted', status: 'success' })
      navigate('/notes', { replace: true })
    } catch (err) {
      toast({ title: 'Could not delete note', description: err.message, status: 'error' })
    } finally {
      setDeleting(false)
    }
  }

  if (loadError) {
    return (
      <Box>
        <Button as={RouterLink} to="/notes" variant="ghost" size="sm" leftIcon={<FiArrowLeft />} mb={4}>
          Notes
        </Button>
        <ErrorState title="Could not load note" message={loadError} onRetry={load} />
      </Box>
    )
  }
  if (loading) {
    return (
      <Stack spacing={4}>
        <Skeleton h="40px" w="200px" />
        <Skeleton h="400px" />
      </Stack>
    )
  }

  return (
    <MotionFade>
      <Button as={RouterLink} to="/notes" variant="ghost" size="sm" leftIcon={<FiArrowLeft />} mb={2}>
        Notes
      </Button>
      <PageHeader
        eyebrow={isNew ? 'New note' : form.is_published ? 'Published note' : 'Draft'}
        title={form.title || 'Untitled note'}
        actions={
          <>
            {!isNew && form.is_published && (
              <Button as="a" href={`${STOREFRONT_URL}/journal/${form.slug}`} target="_blank" rel="noreferrer" size="sm" variant="ghost" rightIcon={<FiExternalLink />}>
                View live
              </Button>
            )}
            {!isNew && (
              <Button size="sm" variant="outline" colorScheme="red" leftIcon={<FiTrash2 />} onClick={del.onOpen}>
                Delete
              </Button>
            )}
            <Button size="sm" leftIcon={<FiSave />} onClick={save} isLoading={saving} loadingText="Saving">
              {isNew ? 'Create note' : 'Save'}
            </Button>
          </>
        }
      />

      <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }} gap={5}>
        <GridItem minW={0}>
          <Stack spacing={5}>
            <Card>
              <Stack spacing={4}>
                <FormControl isRequired isInvalid={Boolean(errors.title)}>
                  <FormLabel>Title</FormLabel>
                  <Input size="lg" fontFamily="heading" fontWeight={700} fontSize="xl" value={form.title} onChange={(e) => set({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })} placeholder="Festival season 2026: order deadlines" autoFocus={isNew} />
                  {errors.title && <FormHelperText color="red.600">{errors.title}</FormHelperText>}
                </FormControl>
                <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={4}>
                  <FormControl isRequired isInvalid={Boolean(errors.slug)}>
                    <FormLabel>Slug</FormLabel>
                    <InputGroup>
                      <InputLeftAddon fontFamily="mono" fontSize="xs" bg="paper2" borderColor="bone.300">
                        /journal/
                      </InputLeftAddon>
                      <Input
                        fontFamily="mono"
                        value={form.slug}
                        onChange={(e) => {
                          setSlugTouched(true)
                          set({ slug: slugify(e.target.value) || e.target.value.toLowerCase() })
                        }}
                      />
                    </InputGroup>
                    <FormHelperText color={errors.slug ? 'red.600' : 'ink.300'}>{errors.slug || 'Auto-generated from the title until you edit it.'}</FormHelperText>
                  </FormControl>
                  <FormControl>
                    <FormLabel>Kicker</FormLabel>
                    <Input value={form.kicker} onChange={(e) => set({ kicker: e.target.value })} placeholder="Shop notes" />
                    <FormHelperText color="ink.300">Small label above the title.</FormHelperText>
                  </FormControl>
                </Grid>
                <FormControl>
                  <FormLabel>Excerpt</FormLabel>
                  <Textarea rows={2} value={form.excerpt} onChange={(e) => set({ excerpt: e.target.value })} placeholder="One or two sentences for the journal index and link previews." maxLength={280} />
                  <FormHelperText color="ink.300">{form.excerpt.length}/280</FormHelperText>
                </FormControl>
              </Stack>
            </Card>

            <Card
              title="Body"
              action={
                <ButtonGroup size="xs" isAttached variant="outline">
                  <Button leftIcon={<FiEdit3 />} onClick={() => setMode('write')} bg={mode === 'write' ? 'paper2' : 'white'}>
                    Write
                  </Button>
                  <Button leftIcon={<FiEye />} onClick={() => setMode('preview')} bg={mode === 'preview' ? 'paper2' : 'white'}>
                    Preview
                  </Button>
                </ButtonGroup>
              }
            >
              {mode === 'write' ? (
                <>
                  <Textarea value={form.body} onChange={(e) => set({ body: e.target.value })} rows={18} fontFamily="mono" fontSize="sm" placeholder={'## Heading\n\nWrite in Markdown. **Bold**, _italics_, lists, links and images all work.'} />
                  <Text fontSize="xs" color="ink.300" mt={2}>
                    Markdown. Headings with ##, lists with -, links as [text](url).
                  </Text>
                </>
              ) : (
                <Box
                  className="journal-preview"
                  minH="200px"
                  fontSize="md"
                  lineHeight="1.65"
                  sx={{
                    '& h1, & h2, & h3': { fontFamily: 'heading', textTransform: 'uppercase', letterSpacing: '-0.01em', mt: 5, mb: 2, lineHeight: 1.1 },
                    '& h2': { fontSize: '2xl' },
                    '& h3': { fontSize: 'xl' },
                    '& p': { mb: 3 },
                    '& ul, & ol': { pl: 6, mb: 3 },
                    '& a': { color: 'river.600', textDecoration: 'underline' },
                    '& img': { maxW: '100%', borderRadius: 'base', my: 3 },
                    '& blockquote': { borderLeft: '3px solid', borderColor: 'ember.500', pl: 4, color: 'ink.500', my: 3 },
                    '& code': { fontFamily: 'mono', bg: 'paper2', px: 1, borderRadius: 'sm', fontSize: 'sm' },
                    '& hr': { borderColor: 'bone.300', my: 5 },
                  }}
                  dangerouslySetInnerHTML={{ __html: html || '<p style="color:#B8B0A2">Nothing to preview yet.</p>' }}
                />
              )}
            </Card>
          </Stack>
        </GridItem>

        <GridItem minW={0}>
          <Stack spacing={5}>
            <Card title="Publishing">
              <Stack spacing={4}>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Published</FormLabel>
                    <Text fontSize="xs" color="ink.500">
                      {form.published_at ? `First published ${formatDateTime(form.published_at)}` : 'Sets the publish date the first time you turn it on.'}
                    </Text>
                  </Box>
                  <Switch isChecked={form.is_published} onChange={(e) => set({ is_published: e.target.checked })} />
                </FormControl>
                <FormControl display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <FormLabel mb={0}>Pinned</FormLabel>
                    <Text fontSize="xs" color="ink.500">
                      Keeps it at the top of the journal.
                    </Text>
                  </Box>
                  <Switch isChecked={form.is_pinned} onChange={(e) => set({ is_pinned: e.target.checked })} />
                </FormControl>
                <FormControl>
                  <FormLabel>Author</FormLabel>
                  <Input value={form.author_name} onChange={(e) => set({ author_name: e.target.value })} placeholder={displayName} />
                </FormControl>
                <FormControl>
                  <FormLabel>Tags</FormLabel>
                  <TagsInput value={form.tags} onChange={(tags) => set({ tags })} suggestions={['festival', 'process', 'shop', 'deadlines']} />
                </FormControl>
              </Stack>
            </Card>

            <Card title="Cover image">
              <Stack spacing={3}>
                <ImageUpload value={form.cover_image_url} onChange={(url, path) => set({ cover_image_url: url, cover_image_path: path })} productId="journal" size="120px" label="Upload cover" uploader={uploadCover} />
                <FormControl>
                  <FormLabel>Cover alt text</FormLabel>
                  <Input size="sm" value={form.cover_alt} onChange={(e) => set({ cover_alt: e.target.value })} placeholder="Describe the photo" />
                </FormControl>
              </Stack>
            </Card>
          </Stack>
        </GridItem>
      </Grid>

      <ConfirmDialog isOpen={del.isOpen} onClose={del.onClose} onConfirm={remove} isLoading={deleting} title={`Delete “${form.title || 'this note'}”?`} body="The note is removed from the journal immediately. This cannot be undone." confirmLabel="Delete note" />
    </MotionFade>
  )
}
