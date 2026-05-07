import { getUserData, setUserData } from '../auth/users'
import { todayISO } from '../utils'
import type { IncomeProfile } from './types'

const KEY = 'income_profile'

const DEFAULT: IncomeProfile = {
  type: 'monthly',
  monthlyAmount: 0,
  yearlyAmount: 0,
  history: [],
}

export function getIncome(userId: string): IncomeProfile {
  return getUserData<IncomeProfile>(userId, KEY) ?? { ...DEFAULT }
}

export function saveIncome(userId: string, profile: IncomeProfile): void {
  setUserData(userId, KEY, profile)
}

export function updateIncomeAmount(userId: string, monthlyAmount: number, type: IncomeProfile['type']): void {
  const profile = getIncome(userId)
  const today = todayISO()
  const history = [...(profile.history ?? [])]
  const todayIdx = history.findIndex(h => h.date === today)
  if (todayIdx >= 0) history[todayIdx] = { date: today, monthlyAmount }
  else history.push({ date: today, monthlyAmount })

  saveIncome(userId, {
    ...profile,
    type,
    monthlyAmount,
    yearlyAmount: monthlyAmount * 12,
    history,
  })
}
