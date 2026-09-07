import * as fx from '../fixtures'
import { wait, clone } from './_util'

if (!import.meta.env.DEV) throw new Error('Fishbone Pulse preview modules are development-only.')
export const SETTINGS_DEFAULTS = clone(fx.settings)
const state = { settings: clone(fx.settings) }

export async function getAllSettings() {
  await wait()
  return clone(state.settings)
}
export async function upsertSetting(key, value) {
  await wait()
  state.settings[key] = clone(value)
  return { key, value: clone(value) }
}
export async function listAdmins() {
  await wait()
  return clone(fx.admins)
}
