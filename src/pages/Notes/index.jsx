import { useCallback, useEffect, useState } from 'react'
import { Link as RouterLink, useNavigate, useSearchParams } from 'react-router-dom'
import { Badge, Box, Button, HStack, Image, Link, Table, Tab, TabList, Tabs, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'
import { FiImage, FiPlus } from 'react-icons/fi'
import PageHeader from '../../components/common/PageHeader'
import Card from '../../components/common/Card'
import SearchInput from '../../components/common/SearchInput'
import TableSkeleton from '../../components/common/TableSkeleton'
import EmptyState from '../../components/common/EmptyState'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import Mono from '../../components/common/Mono'
import { listPosts } from '../../lib/api/posts'
import { formatDate, timeAgo } from '../../utils/format'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'published', label: 'Published' },
  { key: 'draft', label: 'Drafts' },
]

export default function Notes() {
  const [params, setParams] = useSearchParams()
  const filter = params.get('filter') || 'all'
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setPosts(await listPosts({ filter, search }))
    } catch (err) {
      setError(err.message)
    }
  }, [filter, search])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  return (
    <MotionFade>
      <PageHeader
        eyebrow="Journal"
        title="Notes"
        description="Shop news, process notes and festival deadlines published to the storefront journal."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Title or slug" />
            <Button as={RouterLink} to="/notes/new" size="sm" leftIcon={<FiPlus />}>
              New note
            </Button>
          </>
        }
      />

      <Tabs
        index={Math.max(0, FILTERS.findIndex((f) => f.key === filter))}
        onChange={(i) => {
          const next = new URLSearchParams(params)
          if (FILTERS[i].key === 'all') next.delete('filter')
          else next.set('filter', FILTERS[i].key)
          setParams(next, { replace: true })
        }}
        size="sm"
        mb={4}
      >
        <TabList>
          {FILTERS.map((f) => (
            <Tab key={f.key} fontSize="xs" px={3}>
              {f.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      <Card p={0}>
        {error ? (
          <Box p={4}>
            <ErrorState message={error} onRetry={load} />
          </Box>
        ) : posts === null ? (
          <TableSkeleton rows={5} height="56px" />
        ) : posts.length === 0 ? (
          <EmptyState
            title={search ? 'No notes match' : filter === 'draft' ? 'No drafts' : 'No notes yet'}
            description="Write the first one: festival deadlines, a new press, why you print water-based."
            action={
              !search && (
                <Button as={RouterLink} to="/notes/new" size="sm" leftIcon={<FiPlus />}>
                  New note
                </Button>
              )
            }
          />
        ) : (
          <Box overflowX="auto">
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Note</Th>
                  <Th>Status</Th>
                  <Th>Author</Th>
                  <Th>Published</Th>
                  <Th>Updated</Th>
                </Tr>
              </Thead>
              <Tbody>
                {posts.map((p) => (
                  <Tr key={p.id} cursor="pointer" _hover={{ bg: 'paper2' }} onClick={() => navigate(`/notes/${p.id}`)}>
                    <Td>
                      <HStack spacing={3}>
                        <Box w="48px" h="36px" bg="paper2" borderRadius="sm" overflow="hidden" flexShrink={0} display="flex" alignItems="center" justifyContent="center" color="bone.400">
                          {p.cover_image_url ? <Image src={p.cover_image_url} alt="" w="full" h="full" objectFit="cover" /> : <FiImage />}
                        </Box>
                        <Box minW={0}>
                          <HStack spacing={2}>
                            <Link as={RouterLink} to={`/notes/${p.id}`} fontWeight={600} noOfLines={1} onClick={(e) => e.stopPropagation()} _hover={{ color: 'ember.600' }}>
                              {p.title || 'Untitled'}
                            </Link>
                            {p.is_pinned && (
                              <Badge bg="hivis.100" color="hivis.900" fontSize="10px">
                                Pinned
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="ink.500" noOfLines={1}>
                            {p.kicker ? `${p.kicker} · ` : ''}
                            <Mono fontSize="xs">/journal/{p.slug}</Mono>
                          </Text>
                        </Box>
                      </HStack>
                    </Td>
                    <Td>
                      {p.is_published ? (
                        <Badge bg="green.100" color="green.800" fontSize="xs">
                          Published
                        </Badge>
                      ) : (
                        <Badge bg="bone.200" color="ink.700" fontSize="xs">
                          Draft
                        </Badge>
                      )}
                    </Td>
                    <Td fontSize="sm">{p.author_name || '—'}</Td>
                    <Td whiteSpace="nowrap" fontSize="sm" color="ink.500">
                      {p.published_at ? formatDate(p.published_at) : '—'}
                    </Td>
                    <Td whiteSpace="nowrap" fontSize="sm" color="ink.500">
                      {timeAgo(p.updated_at)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
    </MotionFade>
  )
}
