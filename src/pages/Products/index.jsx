import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  IconButton,
  Image,
  Link,
  Select,
  SimpleGrid,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  useToast,
  Skeleton,
} from '@chakra-ui/react'
import { FiGrid, FiList, FiPlus, FiImage } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import SearchInput from '../../components/common/SearchInput'
import Pagination from '../../components/common/Pagination'
import TableSkeleton from '../../components/common/TableSkeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import { ActiveBadge } from '../../components/common/StatusBadge'
import { listProducts, toggleProductActive } from '../../lib/api/products'
import { listCategories } from '../../lib/api/categories'
import { formatMoney } from '../../utils/money'

function primaryImage(p) {
  return Array.isArray(p.images) && p.images[0]?.url ? p.images[0].url : null
}

export default function Products() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const toast = useToast()
  const page = parseInt(params.get('page') || '1', 10)
  const categoryId = params.get('category') || 'all'
  const active = params.get('active') || 'all'
  const [view, setView] = useState(() => {
    try {
      return localStorage.getItem('pulse.products.view') || 'table'
    } catch {
      return 'table'
    }
  })
  const [search, setSearch] = useState('')
  const [categories, setCategories] = useState([])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    listCategories({ includeCounts: false }).then(setCategories).catch(() => {})
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('pulse.products.view', view)
    } catch {
      /* ignore */
    }
  }, [view])

  const setParam = (patch) => {
    const next = new URLSearchParams(params)
    Object.entries(patch).forEach(([k, v]) => {
      if (!v || v === 'all' || v === 1) next.delete(k)
      else next.set(k, String(v))
    })
    setParams(next, { replace: true })
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setResult(await listProducts({ search, categoryId, active, page }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [search, categoryId, active, page])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  const toggle = async (p, next) => {
    setResult((r) => ({ ...r, rows: r.rows.map((row) => (row.id === p.id ? { ...row, is_active: next } : row)) }))
    try {
      await toggleProductActive(p.id, next, p.name)
      toast({ title: next ? `${p.name} is live` : `${p.name} hidden from the shop`, status: 'success', duration: 1500 })
    } catch (err) {
      setResult((r) => ({ ...r, rows: r.rows.map((row) => (row.id === p.id ? { ...row, is_active: !next } : row)) }))
      toast({ title: 'Could not update product', description: err.message, status: 'error' })
    }
  }

  const rows = result?.rows || []

  return (
    <MotionFade>
      <PageHeader
        eyebrow="Catalog"
        title="Blanks"
        description="Everything customers can order on the storefront. Hidden products stay in the catalog but are not shown."
        actions={
          <Button as={RouterLink} to="/products/new" leftIcon={<FiPlus />} size="sm">
            New product
          </Button>
        }
      />

      <HStack mb={4} spacing={3} flexWrap="wrap">
        <SearchInput value={search} onChange={setSearch} placeholder="Name, slug, brand or style #" />
        <Select size="md" maxW="220px" value={categoryId} onChange={(e) => setParam({ category: e.target.value, page: 1 })} aria-label="Filter by category">
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select size="md" maxW="160px" value={active} onChange={(e) => setParam({ active: e.target.value, page: 1 })} aria-label="Filter by visibility">
          <option value="all">Live + hidden</option>
          <option value="active">Live only</option>
          <option value="inactive">Hidden only</option>
        </Select>
        <Box flex="1" />
        <ButtonGroup size="sm" isAttached variant="outline">
          <IconButton aria-label="Table view" icon={<FiList />} isActive={view === 'table'} onClick={() => setView('table')} bg={view === 'table' ? 'paper2' : 'white'} />
          <IconButton aria-label="Grid view" icon={<FiGrid />} isActive={view === 'grid'} onClick={() => setView('grid')} bg={view === 'grid' ? 'paper2' : 'white'} />
        </ButtonGroup>
      </HStack>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && !result ? (
        view === 'grid' ? (
          <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={4}>
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} h="260px" />
            ))}
          </SimpleGrid>
        ) : (
          <Card p={0}>
            <TableSkeleton rows={8} />
          </Card>
        )
      ) : rows.length === 0 ? (
        <Card p={0}>
          <EmptyState
            title={search ? 'No products match' : 'No products yet'}
            description={search ? `Nothing in the catalog matches “${search}”.` : 'Add your first blank — a tee, hoodie or hat — with colors and quantity pricing.'}
            action={
              !search && (
                <Button as={RouterLink} to="/products/new" leftIcon={<FiPlus />} size="sm">
                  New product
                </Button>
              )
            }
          />
        </Card>
      ) : view === 'grid' ? (
        <SimpleGrid columns={{ base: 2, md: 3, xl: 4 }} spacing={4} opacity={loading ? 0.6 : 1}>
          {rows.map((p) => {
            const img = primaryImage(p)
            return (
              <Box key={p.id} bg="white" borderRadius="base" boxShadow="card" overflow="hidden" _hover={{ boxShadow: '0 0 0 1px #FF6A13' }} transition="box-shadow 0.15s">
                <Box as={RouterLink} to={`/products/${p.id}`} display="block" position="relative" pt="90%" bg="paper2">
                  {img ? (
                    <Image src={img} alt={p.images?.[0]?.alt || p.name} position="absolute" inset={0} w="full" h="full" objectFit="cover" />
                  ) : (
                    <Box position="absolute" inset={0} display="flex" alignItems="center" justifyContent="center" color="bone.400">
                      <FiImage size={28} />
                    </Box>
                  )}
                  {!p.is_active && (
                    <Box position="absolute" top={2} left={2}>
                      <ActiveBadge active={false} />
                    </Box>
                  )}
                </Box>
                <Box p={3}>
                  <Link as={RouterLink} to={`/products/${p.id}`} fontWeight={600} noOfLines={1} _hover={{ color: 'ember.600' }}>
                    {p.name}
                  </Link>
                  <Text fontSize="xs" color="ink.500" noOfLines={1}>
                    {p.category?.name || 'Uncategorized'}
                    {p.brand ? ` · ${p.brand}` : ''}
                  </Text>
                  <HStack justify="space-between" mt={2}>
                    <Mono fontWeight={500}>
                      {formatMoney(p.base_price)}{' '}
                      <Text as="span" fontFamily="body" fontSize="xs" color="ink.500">
                        {p.price_unit || 'each'}
                      </Text>
                    </Mono>
                    <Switch size="sm" isChecked={p.is_active} onChange={(e) => toggle(p, e.target.checked)} aria-label={`Toggle ${p.name} visibility`} />
                  </HStack>
                </Box>
              </Box>
            )
          })}
        </SimpleGrid>
      ) : (
        <Card p={0}>
          <Box overflowX="auto" opacity={loading ? 0.6 : 1}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Product</Th>
                  <Th>Category</Th>
                  <Th>Style</Th>
                  <Th isNumeric>Colors</Th>
                  <Th isNumeric>Base price</Th>
                  <Th isNumeric>Min</Th>
                  <Th>Live</Th>
                </Tr>
              </Thead>
              <Tbody>
                {rows.map((p) => {
                  const img = primaryImage(p)
                  return (
                    <Tr key={p.id} _hover={{ bg: 'paper2' }} cursor="pointer" onClick={() => navigate(`/products/${p.id}`)}>
                      <Td>
                        <HStack spacing={3}>
                          <Box w="40px" h="40px" bg="paper2" borderRadius="sm" overflow="hidden" flexShrink={0} display="flex" alignItems="center" justifyContent="center" color="bone.400">
                            {img ? <Image src={img} alt="" w="full" h="full" objectFit="cover" /> : <FiImage />}
                          </Box>
                          <Box minW={0}>
                            <HStack spacing={2}>
                              <Link as={RouterLink} to={`/products/${p.id}`} fontWeight={600} noOfLines={1} onClick={(e) => e.stopPropagation()} _hover={{ color: 'ember.600' }}>
                                {p.name}
                              </Link>
                              {p.is_featured && (
                                <Box w="6px" h="6px" borderRadius="full" bg="hivis.400" title="Featured" />
                              )}
                            </HStack>
                            <Text fontSize="xs" color="ink.500" fontFamily="mono" noOfLines={1}>
                              /{p.slug}
                            </Text>
                          </Box>
                        </HStack>
                      </Td>
                      <Td>{p.category?.name || <Text color="ink.300">—</Text>}</Td>
                      <Td fontSize="xs" color="ink.500">
                        {[p.brand, p.style_number].filter(Boolean).join(' ') || '—'}
                      </Td>
                      <Td isNumeric>
                        <Mono>{p.product_variants?.[0]?.count ?? 0}</Mono>
                      </Td>
                      <Td isNumeric>
                        <Mono>{formatMoney(p.base_price)}</Mono>
                        <Text as="span" fontSize="xs" color="ink.500" ml={1}>
                          {p.price_unit || 'each'}
                        </Text>
                      </Td>
                      <Td isNumeric>
                        <Mono>{p.min_quantity ?? 1}</Mono>
                      </Td>
                      <Td onClick={(e) => e.stopPropagation()}>
                        <Switch size="sm" isChecked={p.is_active} onChange={(e) => toggle(p, e.target.checked)} aria-label={`Toggle ${p.name} visibility`} />
                      </Td>
                    </Tr>
                  )
                })}
              </Tbody>
            </Table>
          </Box>
        </Card>
      )}
      {result && <Pagination page={result.page} pageSize={result.pageSize} count={result.count} onChange={(p) => setParam({ page: p })} />}
    </MotionFade>
  )
}
