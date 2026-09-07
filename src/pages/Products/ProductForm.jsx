import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom'
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  NumberInput,
  NumberInputField,
  Select,
  SimpleGrid,
  Skeleton,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useDisclosure,
  useToast,
} from '@chakra-ui/react'
import { FiArrowLeft, FiExternalLink, FiSave, FiTrash2 } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import ConfirmDialog from '../../components/common/ConfirmDialog'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import TagsInput from '../../components/common/TagsInput'
import ListEditor from '../../components/common/ListEditor'
import VariantsEditor from '../../components/products/VariantsEditor'
import TiersEditor from '../../components/products/TiersEditor'
import { validateTiers } from '../../lib/tiers'
import ImagesGallery from '../../components/products/ImagesGallery'
import { ActiveBadge } from '../../components/common/StatusBadge'
import {
  createProduct,
  deleteProduct,
  getProduct,
  listDecorationOptions,
  PRICE_UNITS,
  slugExists,
  updateProduct,
  upsertTiers,
  upsertVariants,
} from '../../lib/api/products'
import { listCategories } from '../../lib/api/categories'
import { slugify } from '../../utils/format'

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL', '2XL']
const PRINT_LOCATION_SUGGESTIONS = ['Front', 'Back', 'Left chest', 'Right chest', 'Left sleeve', 'Right sleeve', 'Nape', 'Front pocket']
const BADGE_SUGGESTIONS = ['New', 'Best seller', 'Festival favorite', 'Eco', 'Made in USA', 'Heavyweight']

const EMPTY = {
  name: '',
  slug: '',
  brand: '',
  style_number: '',
  category_id: '',
  short_description: '',
  description: '',
  base_price: '',
  price_unit: 'each',
  min_quantity: 12,
  is_featured: false,
  featured_order: '',
  is_active: true,
  badges: [],
  features: [],
  sizes: DEFAULT_SIZES,
  decoration_methods: [],
  print_locations: ['Front', 'Back'],
  images: [],
}

function fromRecord(p) {
  return {
    name: p.name || '',
    slug: p.slug || '',
    brand: p.brand || '',
    style_number: p.style_number || '',
    category_id: p.category_id || '',
    short_description: p.short_description || '',
    description: p.description || '',
    base_price: p.base_price ?? '',
    price_unit: p.price_unit || 'each',
    min_quantity: p.min_quantity ?? 1,
    is_featured: Boolean(p.is_featured),
    featured_order: p.featured_order ?? '',
    is_active: p.is_active !== false,
    badges: p.badges || [],
    features: p.features || [],
    sizes: Array.isArray(p.specs?.sizes) ? p.specs.sizes : [],
    decoration_methods: p.decoration_methods || [],
    print_locations: p.print_locations || [],
    images: Array.isArray(p.images) ? p.images : [],
    specs: p.specs || {},
  }
}

export default function ProductForm() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const del = useDisclosure()

  const [form, setForm] = useState(EMPTY)
  const [variants, setVariants] = useState([])
  const [tiers, setTiers] = useState([])
  const [categories, setCategories] = useState([])
  const [decoration, setDecoration] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [slugTouched, setSlugTouched] = useState(false)
  const [errors, setErrors] = useState({})
  const [tab, setTab] = useState(0)

  const load = useCallback(async () => {
    setLoadError('')
    try {
      const [cats, decos] = await Promise.all([listCategories({ includeCounts: false }), listDecorationOptions()])
      setCategories(cats)
      setDecoration(decos)
      if (!isNew) {
        const p = await getProduct(id)
        if (!p) {
          setLoadError('This product does not exist.')
          return
        }
        setForm(fromRecord(p))
        setVariants(p.variants)
        setTiers(p.tiers.map((t) => ({ ...t, max_qty: t.max_qty ?? '' })))
        setSlugTouched(true)
      }
    } catch (err) {
      setLoadError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id, isNew])

  useEffect(() => {
    load()
  }, [load])

  const set = (patch) => setForm((f) => ({ ...f, ...patch }))

  const onNameChange = (name) => {
    set({ name, ...(slugTouched ? {} : { slug: slugify(name) }) })
  }

  const tierProblems = useMemo(() => validateTiers(tiers), [tiers])

  const validate = async () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Give the product a name.'
    if (!form.slug.trim()) e.slug = 'A slug is required for the product URL.'
    else if (!/^[a-z0-9-]+$/.test(form.slug)) e.slug = 'Lowercase letters, numbers and dashes only.'
    if (form.base_price === '' || Number.isNaN(Number(form.base_price)) || Number(form.base_price) < 0) e.base_price = 'Enter a base price (0 is allowed).'
    if (!form.min_quantity || Number(form.min_quantity) < 1) e.min_quantity = 'Minimum quantity must be at least 1.'
    if (tierProblems.length) e.tiers = 'Fix the pricing tier problems before saving.'
    if (variants.some((v) => !v.color_name?.trim())) e.variants = 'Every color variant needs a name.'
    if (!e.slug) {
      try {
        if (await slugExists(form.slug, id)) e.slug = 'Another product already uses this slug.'
      } catch {
        /* network error surfaces on save */
      }
    }
    setErrors(e)
    return e
  }

  const save = async () => {
    setSaving(true)
    try {
      const e = await validate()
      if (Object.keys(e).length) {
        toast({ title: 'Check the form', description: Object.values(e)[0], status: 'warning' })
        if (e.tiers) setTab(2)
        else if (e.variants) setTab(1)
        else setTab(0)
        return
      }
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        brand: form.brand.trim() || null,
        style_number: form.style_number.trim() || null,
        category_id: form.category_id || null,
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        base_price: Number(form.base_price),
        price_unit: form.price_unit || 'each',
        min_quantity: Number(form.min_quantity) || 1,
        is_featured: form.is_featured,
        featured_order: form.is_featured && form.featured_order !== '' ? Number(form.featured_order) : null,
        is_active: form.is_active,
        badges: form.badges,
        features: form.features.map((f) => f.trim()).filter(Boolean),
        specs: { ...(form.specs || {}), sizes: form.sizes.map((s) => s.trim()).filter(Boolean) },
        decoration_methods: form.decoration_methods,
        print_locations: form.print_locations,
        images: form.images,
      }
      let productId = id
      if (isNew) {
        const created = await createProduct(payload)
        productId = created.id
      } else {
        await updateProduct(id, payload)
      }
      await Promise.all([upsertVariants(productId, variants), upsertTiers(productId, tiers)])
      toast({ title: isNew ? 'Product created' : 'Product saved', status: 'success', duration: 2000 })
      if (isNew) navigate(`/products/${productId}`, { replace: true })
      else await load()
    } catch (err) {
      toast({ title: 'Could not save product', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    setDeleting(true)
    try {
      await deleteProduct(id, form.name)
      toast({ title: `Deleted ${form.name}`, status: 'success' })
      navigate('/products', { replace: true })
    } catch (err) {
      toast({ title: 'Could not delete product', description: err.message, status: 'error' })
    } finally {
      setDeleting(false)
      del.onClose()
    }
  }

  if (loadError) {
    return (
      <Box>
        <Button as={RouterLink} to="/products" variant="ghost" size="sm" leftIcon={<FiArrowLeft />} mb={4}>
          Products
        </Button>
        <ErrorState title="Could not load product" message={loadError} onRetry={load} />
      </Box>
    )
  }

  if (loading) {
    return (
      <Stack spacing={4}>
        <Skeleton h="40px" w="240px" />
        <Skeleton h="420px" />
      </Stack>
    )
  }

  return (
    <MotionFade>
      <Button as={RouterLink} to="/products" variant="ghost" size="sm" leftIcon={<FiArrowLeft />} mb={2}>
        Products
      </Button>
      <PageHeader
        eyebrow={isNew ? 'New product' : 'Edit product'}
        title={form.name || 'Untitled product'}
        actions={
          <>
            {!isNew && <ActiveBadge active={form.is_active} />}
            {!isNew && form.slug && (
              <Button as="a" href={`https://fishbonegraphics.com/product/${form.slug}`} target="_blank" rel="noreferrer" size="sm" variant="ghost" rightIcon={<FiExternalLink />}>
                View on shop
              </Button>
            )}
            {!isNew && (
              <Button size="sm" variant="outline" colorScheme="red" leftIcon={<FiTrash2 />} onClick={del.onOpen}>
                Delete
              </Button>
            )}
            <Button size="sm" leftIcon={<FiSave />} onClick={save} isLoading={saving} loadingText="Saving">
              {isNew ? 'Create product' : 'Save changes'}
            </Button>
          </>
        }
      />

      <Tabs index={tab} onChange={setTab} isLazy={false}>
        <TabList mb={5} overflowX="auto">
          <Tab>Basics</Tab>
          <Tab>
            Colors{variants.length ? ` (${variants.length})` : ''}
          </Tab>
          <Tab color={tierProblems.length ? 'red.600' : undefined}>Pricing tiers{tiers.length ? ` (${tiers.length})` : ''}</Tab>
          <Tab>Images{form.images.length ? ` (${form.images.length})` : ''}</Tab>
        </TabList>
        <TabPanels>
          {/* Basics */}
          <TabPanel p={0}>
            <Grid templateColumns={{ base: '1fr', xl: 'minmax(0, 2fr) minmax(300px, 1fr)' }} gap={5}>
              <GridItem minW={0}>
                <Stack spacing={5}>
                  <Card title="Product">
                    <Stack spacing={4}>
                      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                        <FormControl isRequired isInvalid={Boolean(errors.name)}>
                          <FormLabel>Name</FormLabel>
                          <Input value={form.name} onChange={(e) => onNameChange(e.target.value)} placeholder="Heavyweight Cotton Tee" autoFocus={isNew} />
                          {errors.name && <FormHelperText color="red.600">{errors.name}</FormHelperText>}
                        </FormControl>
                        <FormControl isRequired isInvalid={Boolean(errors.slug)}>
                          <FormLabel>Slug</FormLabel>
                          <InputGroup>
                            <InputLeftAddon fontFamily="mono" fontSize="xs" bg="paper2" borderColor="bone.300">
                              /product/
                            </InputLeftAddon>
                            <Input
                              fontFamily="mono"
                              value={form.slug}
                              onChange={(e) => {
                                setSlugTouched(true)
                                set({ slug: slugify(e.target.value) || e.target.value.toLowerCase() })
                              }}
                              placeholder="heavyweight-cotton-tee"
                            />
                          </InputGroup>
                          <FormHelperText color={errors.slug ? 'red.600' : 'ink.300'}>{errors.slug || 'Auto-generated from the name until you edit it.'}</FormHelperText>
                        </FormControl>
                        <FormControl>
                          <FormLabel>Brand</FormLabel>
                          <Input value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="Gildan, Comfort Colors, Bella+Canvas" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Style number</FormLabel>
                          <Input fontFamily="mono" value={form.style_number} onChange={(e) => set({ style_number: e.target.value })} placeholder="G500" />
                        </FormControl>
                        <FormControl>
                          <FormLabel>Category</FormLabel>
                          <Select value={form.category_id} onChange={(e) => set({ category_id: e.target.value })}>
                            <option value="">Uncategorized</option>
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                                {c.is_active ? '' : ' (hidden)'}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                      </SimpleGrid>
                      <FormControl>
                        <FormLabel>Short description</FormLabel>
                        <Input value={form.short_description} onChange={(e) => set({ short_description: e.target.value })} placeholder="One line shown on the shop grid" maxLength={160} />
                        <FormHelperText color="ink.300">{form.short_description.length}/160</FormHelperText>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Description</FormLabel>
                        <Textarea value={form.description} onChange={(e) => set({ description: e.target.value })} rows={6} placeholder="Fabric weight, fit, what it prints like, who it is good for. Plain paragraphs." />
                      </FormControl>
                    </Stack>
                  </Card>

                  <Card title="Decoration">
                    <Stack spacing={4}>
                      <FormControl>
                        <FormLabel>Decoration methods offered</FormLabel>
                        {decoration.length === 0 ? (
                          <Text fontSize="sm" color="ink.500">
                            No decoration options are configured in the database yet.
                          </Text>
                        ) : (
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={2}>
                            {decoration.map((d) => (
                              <Checkbox
                                key={d.key}
                                isChecked={form.decoration_methods.includes(d.key)}
                                onChange={(e) =>
                                  set({
                                    decoration_methods: e.target.checked ? [...form.decoration_methods, d.key] : form.decoration_methods.filter((k) => k !== d.key),
                                  })
                                }
                                alignItems="flex-start"
                              >
                                <Text fontSize="sm" fontWeight={500} lineHeight="1.2">
                                  {d.name}
                                  {!d.is_active && (
                                    <Text as="span" color="ink.300" fontSize="xs" ml={1}>
                                      (inactive)
                                    </Text>
                                  )}
                                </Text>
                                {d.description && (
                                  <Text fontSize="xs" color="ink.500">
                                    {d.description}
                                  </Text>
                                )}
                              </Checkbox>
                            ))}
                          </SimpleGrid>
                        )}
                      </FormControl>
                      <FormControl>
                        <FormLabel>Print locations</FormLabel>
                        <TagsInput value={form.print_locations} onChange={(v) => set({ print_locations: v })} suggestions={PRINT_LOCATION_SUGGESTIONS} placeholder="Front, Back, Left chest…" />
                      </FormControl>
                    </Stack>
                  </Card>

                  <Card title="Sizes & features">
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                      <FormControl>
                        <FormLabel>Sizes (specs.sizes)</FormLabel>
                        <ListEditor value={form.sizes} onChange={(v) => set({ sizes: v })} placeholder="XL" addLabel="Add size" />
                        <FormHelperText color="ink.300">Customers split their quantity across these sizes at checkout. Leave empty for one-size items.</FormHelperText>
                      </FormControl>
                      <FormControl>
                        <FormLabel>Features</FormLabel>
                        <ListEditor value={form.features} onChange={(v) => set({ features: v })} placeholder="6.1 oz ring-spun cotton" addLabel="Add feature" />
                      </FormControl>
                    </SimpleGrid>
                  </Card>
                </Stack>
              </GridItem>

              <GridItem minW={0}>
                <Stack spacing={5}>
                  <Card title="Pricing">
                    <Stack spacing={4}>
                      <FormControl isRequired isInvalid={Boolean(errors.base_price)}>
                        <FormLabel>Base price</FormLabel>
                        <InputGroup>
                          <InputLeftAddon bg="paper2" borderColor="bone.300">
                            $
                          </InputLeftAddon>
                          <NumberInput value={form.base_price} min={0} precision={2} step={0.5} onChange={(v) => set({ base_price: v })} w="full">
                            <NumberInputField fontFamily="mono" borderLeftRadius={0} placeholder="0.00" />
                          </NumberInput>
                        </InputGroup>
                        {errors.base_price && <FormHelperText color="red.600">{errors.base_price}</FormHelperText>}
                      </FormControl>
                      <SimpleGrid columns={2} spacing={3}>
                        <FormControl>
                          <FormLabel>Unit</FormLabel>
                          <Select value={form.price_unit} onChange={(e) => set({ price_unit: e.target.value })}>
                            {PRICE_UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u}
                              </option>
                            ))}
                          </Select>
                        </FormControl>
                        <FormControl isInvalid={Boolean(errors.min_quantity)}>
                          <FormLabel>Min quantity</FormLabel>
                          <NumberInput value={form.min_quantity} min={1} onChange={(v) => set({ min_quantity: v })}>
                            <NumberInputField fontFamily="mono" />
                          </NumberInput>
                        </FormControl>
                      </SimpleGrid>
                      <Text fontSize="xs" color="ink.500">
                        Quantity price breaks live on the <b>Pricing tiers</b> tab. The storefront computes final prices server-side.
                      </Text>
                    </Stack>
                  </Card>

                  <Card title="Visibility">
                    <Stack spacing={4}>
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel mb={0}>Live on the shop</FormLabel>
                          <Text fontSize="xs" color="ink.500">
                            Hidden products keep their data but do not appear.
                          </Text>
                        </Box>
                        <Switch isChecked={form.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
                      </FormControl>
                      <FormControl display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <FormLabel mb={0}>Featured</FormLabel>
                          <Text fontSize="xs" color="ink.500">
                            Shown on the home page and top of the shop.
                          </Text>
                        </Box>
                        <Switch isChecked={form.is_featured} onChange={(e) => set({ is_featured: e.target.checked })} />
                      </FormControl>
                      {form.is_featured && (
                        <FormControl>
                          <FormLabel>Featured order</FormLabel>
                          <NumberInput value={form.featured_order} min={0} onChange={(v) => set({ featured_order: v })}>
                            <NumberInputField fontFamily="mono" placeholder="1" />
                          </NumberInput>
                          <FormHelperText color="ink.300">Lower numbers show first.</FormHelperText>
                        </FormControl>
                      )}
                      <FormControl>
                        <FormLabel>Badges</FormLabel>
                        <TagsInput value={form.badges} onChange={(v) => set({ badges: v })} suggestions={BADGE_SUGGESTIONS} placeholder="Best seller" />
                      </FormControl>
                    </Stack>
                  </Card>
                </Stack>
              </GridItem>
            </Grid>
          </TabPanel>

          {/* Variants */}
          <TabPanel p={0}>
            <Card title="Color variants">
              {errors.variants && (
                <Text fontSize="sm" color="red.600" mb={3}>
                  {errors.variants}
                </Text>
              )}
              <VariantsEditor value={variants} onChange={setVariants} productId={id || 'new'} />
            </Card>
          </TabPanel>

          {/* Tiers */}
          <TabPanel p={0}>
            <Card title="Quantity pricing">
              <TiersEditor value={tiers} onChange={setTiers} basePrice={form.base_price} />
            </Card>
          </TabPanel>

          {/* Images */}
          <TabPanel p={0}>
            <Card title="Gallery">
              <ImagesGallery value={form.images} onChange={(images) => set({ images })} productId={id || 'new'} />
            </Card>
          </TabPanel>
        </TabPanels>
      </Tabs>

      <HStack mt={6} justify="flex-end" position="sticky" bottom={4} zIndex={5}>
        <Button size="md" leftIcon={<FiSave />} onClick={save} isLoading={saving} loadingText="Saving" boxShadow="lg">
          {isNew ? 'Create product' : 'Save changes'}
        </Button>
      </HStack>

      <ConfirmDialog
        isOpen={del.isOpen}
        onClose={del.onClose}
        onConfirm={remove}
        isLoading={deleting}
        title={`Delete ${form.name || 'this product'}?`}
        body="This removes the product, its color variants and pricing tiers from the catalog. Past orders keep their own copy of the product name and price. This cannot be undone."
        confirmLabel="Delete product"
      />
    </MotionFade>
  )
}
