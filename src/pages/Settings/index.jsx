import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Skeleton, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react'
import PageHeader from '../../components/common/PageHeader'
import ErrorState from '../../components/common/ErrorState'
import MotionFade from '../../components/common/MotionFade'
import { getAllSettings } from '../../lib/api/settings'
import StoreTab from './StoreTab'
import { AnnouncementTab, OrderingTab, PaymentsTab, ShippingTab, TaxTab } from './ShopTabs'
import AccountTab from './AccountTab'
import TeamTab from './TeamTab'

const TABS = [
  { key: 'store', label: 'Store' },
  { key: 'ordering', label: 'Ordering' },
  { key: 'tax', label: 'Tax' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'payments', label: 'Payments' },
  { key: 'announcement', label: 'Announcement' },
  { key: 'team', label: 'Team' },
  { key: 'account', label: 'Account' },
]
const STANDALONE = new Set(['team', 'account'])

export default function Settings() {
  const [params, setParams] = useSearchParams()
  const tabKey = params.get('tab') || 'store'
  const tabIndex = Math.max(0, TABS.findIndex((t) => t.key === tabKey))
  const [settings, setSettings] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setError('')
    try {
      setSettings(await getAllSettings())
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const onSaved = (key, value) => setSettings((s) => ({ ...s, [key]: value }))

  const setTab = (i) => {
    const next = new URLSearchParams(params)
    if (TABS[i].key === 'store') next.delete('tab')
    else next.set('tab', TABS[i].key)
    setParams(next, { replace: true })
  }

  const needsSettings = !STANDALONE.has(tabKey)

  return (
    <MotionFade>
      <PageHeader eyebrow="Shop" title="Settings" description="Store details, pricing rules, storefront options, your team and your account." />
      <Tabs index={tabIndex} onChange={setTab} isLazy>
        <TabList mb={5} overflowX="auto">
          {TABS.map((t) => (
            <Tab key={t.key} fontSize="xs" px={3}>
              {t.label}
            </Tab>
          ))}
        </TabList>
        {needsSettings && error ? (
          <ErrorState message={error} onRetry={load} />
        ) : needsSettings && !settings ? (
          <Skeleton h="320px" />
        ) : (
          <TabPanels>
            <TabPanel p={0}>
              <StoreTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <OrderingTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <TaxTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <ShippingTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <PaymentsTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <AnnouncementTab settings={settings} onSaved={onSaved} />
            </TabPanel>
            <TabPanel p={0}>
              <TeamTab />
            </TabPanel>
            <TabPanel p={0}>
              <AccountTab />
            </TabPanel>
          </TabPanels>
        )}
      </Tabs>
    </MotionFade>
  )
}
