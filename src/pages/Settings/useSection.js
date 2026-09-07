import { useEffect, useState } from 'react'
import { useToast } from '@chakra-ui/react'
import { upsertSetting } from '../../lib/api/settings'

/** Draft + save for one settings key. */
export function useSection(settings, key, label, onSaved) {
  const [draft, setDraft] = useState(settings?.[key] || {})
  const [saving, setSaving] = useState(false)
  const toast = useToast()
  useEffect(() => setDraft(settings?.[key] || {}), [settings, key])
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings?.[key] || {})
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }))
  const save = async () => {
    setSaving(true)
    try {
      await upsertSetting(key, draft, { is_public: true })
      onSaved(key, draft)
      toast({ title: `${label} settings saved`, status: 'success', duration: 1500 })
    } catch (err) {
      toast({ title: 'Could not save settings', description: err.message, status: 'error' })
    } finally {
      setSaving(false)
    }
  }
  return { draft, set, save, saving, dirty }
}
