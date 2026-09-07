import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Grid,
  HStack,
  Link,
  Select,
  Stack,
  Tab,
  Table,
  TabList,
  Tabs,
  Tag,
  Tbody,
  Td,
  Text,
  Textarea,
  Th,
  Thead,
  Tr,
  useToast,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import PageHeader from '../components/common/PageHeader'
import Card from '../components/common/Card'
import SearchInput from '../components/common/SearchInput'
import Pagination from '../components/common/Pagination'
import TableSkeleton from '../components/common/TableSkeleton'
import EmptyState from '../components/common/EmptyState'
import ErrorState from '../components/common/ErrorState'
import MotionFade from '../components/common/MotionFade'
import ArtworkList from '../components/orders/ArtworkList'
import { QuoteStatusBadge } from '../components/common/StatusBadge'
import { QUOTE_STATUS_META } from '../lib/statusMeta'
import { listQuotes, QUOTE_STATUSES, updateQuoteNotes, updateQuoteStatus } from '../lib/api/quotes'
import { formatDate, formatDateTime, humanize } from '../utils/format'

const TABS = [{ key: 'all', label: 'All' }, ...QUOTE_STATUSES.map((s) => ({ key: s, label: QUOTE_STATUS_META[s].label }))]

function Field({ label, children }) {
  return (
    <Box>
      <Text fontFamily="heading" fontSize="xs" letterSpacing="0.1em" textTransform="uppercase" color="ink.500" fontWeight={600}>
        {label}
      </Text>
      <Box fontSize="sm" mt={0.5}>
        {children || <Text color="ink.300">—</Text>}
      </Box>
    </Box>
  )
}

export default function Quotes() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || 'all'
  const page = parseInt(params.get('page') || '1', 10)
  const [search, setSearch] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState('')
  const toast = useToast()

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
      setResult(await listQuotes({ status, search, page }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [status, search, page])

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0)
    return () => clearTimeout(t)
  }, [load, search])

  const open = (q) => {
    setSelected(q)
    setNotes(q.internal_notes || '')
  }

  const changeStatus = async (s) => {
    if (!selected || s === selected.status) return
    setSaving('status')
    try {
      await updateQuoteStatus(selected.id, s, { name: selected.name, previous: selected.status })
      setSelected((q) => ({ ...q, status: s }))
      setResult((r) => ({ ...r, rows: r.rows.map((row) => (row.id === selected.id ? { ...row, status: s } : row)) }))
      toast({ title: `Quote marked ${QUOTE_STATUS_META[s].label}`, status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not update quote', description: err.message, status: 'error' })
    } finally {
      setSaving('')
    }
  }

  const saveNotes = async () => {
    if (!selected || notes === (selected.internal_notes || '')) return
    setSaving('notes')
    try {
      await updateQuoteNotes(selected.id, notes)
      setSelected((q) => ({ ...q, internal_notes: notes }))
      setResult((r) => ({ ...r, rows: r.rows.map((row) => (row.id === selected.id ? { ...row, internal_notes: notes } : row)) }))
      toast({ title: 'Notes saved', status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not save notes', description: err.message, status: 'error' })
    } finally {
      setSaving('')
    }
  }

  const tabIndex = Math.max(0, TABS.findIndex((t) => t.key === status))

  return (
    <MotionFade>
      <PageHeader
        eyebrow="Inbound"
        title="Quote requests"
        description="Festival merch, crew shirts and custom jobs that came through the quote and contact forms."
        actions={<SearchInput value={search} onChange={setSearch} placeholder="Name, email, company or event" />}
      />

      <Tabs index={tabIndex} onChange={(i) => setParam({ status: TABS[i].key, page: 1 })} size="sm" mb={4} overflowX="auto">
        <TabList minW="max-content">
          {TABS.map((t) => (
            <Tab key={t.key} fontSize="xs" px={3}>
              {t.label}
            </Tab>
          ))}
        </TabList>
      </Tabs>

      <Card p={0}>
        {error ? (
          <Box p={4}>
            <ErrorState message={error} onRetry={load} />
          </Box>
        ) : loading && !result ? (
          <TableSkeleton rows={6} />
        ) : result?.rows.length === 0 ? (
          <EmptyState title="No quote requests" description="Requests from the storefront's quote and contact forms land here as “New”." />
        ) : (
          <Box overflowX="auto" opacity={loading ? 0.6 : 1}>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>From</Th>
                  <Th>Event</Th>
                  <Th>Interest</Th>
                  <Th isNumeric>Qty est.</Th>
                  <Th>Status</Th>
                  <Th>Received</Th>
                </Tr>
              </Thead>
              <Tbody>
                {result.rows.map((q) => (
                  <Tr key={q.id} cursor="pointer" _hover={{ bg: 'paper2' }} onClick={() => open(q)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && open(q)}>
                    <Td maxW="240px">
                      <Text fontWeight={600} noOfLines={1}>
                        {q.name || '—'}
                      </Text>
                      <Text fontSize="xs" color="ink.500" noOfLines={1}>
                        {q.company ? `${q.company} · ` : ''}
                        {q.email}
                      </Text>
                    </Td>
                    <Td maxW="200px">
                      <Text noOfLines={1}>{q.event_name || '—'}</Text>
                      {q.event_date && (
                        <Text fontSize="xs" color="ink.500">
                          {formatDate(q.event_date)}
                        </Text>
                      )}
                    </Td>
                    <Td maxW="220px">
                      <Wrap spacing={1}>
                        {(q.product_interest || []).slice(0, 3).map((p) => (
                          <WrapItem key={p}>
                            <Tag size="sm" borderRadius="sm" bg="paper2" fontSize="xs">
                              {humanize(p)}
                            </Tag>
                          </WrapItem>
                        ))}
                        {(q.product_interest || []).length > 3 && (
                          <Text fontSize="xs" color="ink.500">
                            +{q.product_interest.length - 3}
                          </Text>
                        )}
                      </Wrap>
                    </Td>
                    <Td isNumeric fontFamily="mono">
                      {q.quantity_estimate ?? '—'}
                    </Td>
                    <Td>
                      <QuoteStatusBadge status={q.status} />
                    </Td>
                    <Td whiteSpace="nowrap" color="ink.500">
                      {formatDate(q.created_at, 'MMM d, h:mm a')}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
      </Card>
      {result && <Pagination page={result.page} pageSize={result.pageSize} count={result.count} onChange={(p) => setParam({ page: p })} />}

      <Drawer isOpen={Boolean(selected)} onClose={() => setSelected(null)} size="md" placement="right">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader pr={12}>
            <Text fontFamily="heading" fontSize="xs" letterSpacing="0.12em" color="ink.500" fontWeight={600}>
              Quote request
            </Text>
            {selected?.name}
          </DrawerHeader>
          <DrawerBody>
            {selected && (
              <Stack spacing={5}>
                <HStack justify="space-between" align="flex-end">
                  <FormControl maxW="240px">
                    <FormLabel>Status</FormLabel>
                    <Select size="sm" value={selected.status} onChange={(e) => changeStatus(e.target.value)} isDisabled={saving === 'status'}>
                      {QUOTE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {QUOTE_STATUS_META[s].label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <Text fontSize="xs" color="ink.500">
                    Received {formatDateTime(selected.created_at)}
                  </Text>
                </HStack>

                <Grid templateColumns="1fr 1fr" gap={4}>
                  <Field label="Email">
                    <Link href={`mailto:${selected.email}`} color="river.600">
                      {selected.email}
                    </Link>
                  </Field>
                  <Field label="Phone">
                    {selected.phone && (
                      <Link href={`tel:${selected.phone}`} color="river.600">
                        {selected.phone}
                      </Link>
                    )}
                  </Field>
                  <Field label="Company">{selected.company}</Field>
                  <Field label="Quantity estimate">{selected.quantity_estimate}</Field>
                  <Field label="Event">{selected.event_name}</Field>
                  <Field label="Event date">{selected.event_date && formatDate(selected.event_date, 'EEE, MMM d, yyyy')}</Field>
                </Grid>

                <Field label="Interested in">
                  <Wrap spacing={1} mt={1}>
                    {(selected.product_interest || []).map((p) => (
                      <WrapItem key={p}>
                        <Tag size="sm" borderRadius="sm" bg="paper2">
                          {humanize(p)}
                        </Tag>
                      </WrapItem>
                    ))}
                  </Wrap>
                </Field>

                <Field label="Description">
                  <Text whiteSpace="pre-wrap">{selected.description}</Text>
                </Field>

                <Field label="Artwork">
                  <Box mt={1}>
                    <ArtworkList files={selected.artwork_files} />
                  </Box>
                </Field>

                <FormControl>
                  <FormLabel>Internal notes</FormLabel>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} rows={5} fontSize="sm" placeholder="Pricing you quoted, follow-up dates, what they said on the phone." />
                  <Text fontSize="xs" color="ink.300" mt={1}>
                    {saving === 'notes' ? 'Saving…' : 'Autosaves when you click away.'}
                  </Text>
                </FormControl>

                <HStack>
                  <Button as="a" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Your Fishbone Graphics quote${selected.event_name ? ` — ${selected.event_name}` : ''}`)}`} size="sm" variant="outline">
                    Reply by email
                  </Button>
                </HStack>
              </Stack>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </MotionFade>
  )
}
