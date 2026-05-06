import { getUserData, setUserData } from '../auth/users'
import type { AppSettings } from './types'

const KEY = 'settings'

const DEFAULTS: AppSettings = {
  currency: 'USD',
  currencySymbol: '$',
  dateFormat: 'MM/DD/YYYY',
}

export function getSettings(userId: string): AppSettings {
  return getUserData<AppSettings>(userId, KEY) ?? DEFAULTS
}

export function saveSettings(userId: string, settings: AppSettings): void {
  setUserData(userId, KEY, settings)
}
