import { getUserData, setUserData } from '../auth/users'
import { generateId, todayISO } from '../utils'
import type { AssetAccount, AssetType } from './types'

const KEY = 'asset_accounts'

export const ASSET_META: Record<AssetType, { label: string; icon: string; color: string; description: string }> = {
  stocks:       { label: 'Stocks',       icon: 'show_chart',         color: '#3B82F6', description: 'Individual shares & equities' },
  etf:          { label: 'ETFs',         icon: 'account_balance',    color: '#8B5CF6', description: 'Exchange-traded funds' },
  crypto:       { label: 'Crypto',       icon: 'currency_bitcoin',   color: '#F59E0B', description: 'Cryptocurrency holdings' },
  real_estate:  { label: 'Real Estate',  icon: 'home',               color: '#EF4444', description: 'Property & real estate' },
  savings:      { label: 'Savings',      icon: 'savings',            color: '#006a61', description: 'Cash & savings accounts' },
  super:        { label: 'Super',        icon: 'elderly',            color: '#0F172A', description: 'Superannuation fund' },
}

export const ASSET_ORDER: AssetType[] = ['stocks', 'etf', 'crypto', 'real_estate', 'savings', 'super']

export function getAssets(userId: string): AssetAccount[] {
  return getUserData<AssetAccount[]>(userId, KEY) ?? []
}

export function saveAssets(userId: string, assets: AssetAccount[]): void {
  setUserData(userId, KEY, assets)
}

export function addAsset(userId: string, data: Omit<AssetAccount, 'id' | 'history' | 'lastUpdated'>): AssetAccount {
  const today = todayISO()
  const asset: AssetAccount = {
    ...data,
    id: generateId(),
    lastUpdated: today,
    history: [{ date: today, value: data.currentValue }],
  }
  saveAssets(userId, [...getAssets(userId), asset])
  return asset
}

export function updateAsset(userId: string, updated: AssetAccount): void {
  const assets = getAssets(userId)
  const existing = assets.find(a => a.id === updated.id)
  const today = todayISO()

  let history = existing?.history ?? []
  if (existing && existing.currentValue !== updated.currentValue) {
    // Replace today's entry if already exists, otherwise append
    const todayIdx = history.findIndex(h => h.date === today)
    if (todayIdx >= 0) {
      history = history.map((h, i) => i === todayIdx ? { date: today, value: updated.currentValue } : h)
    } else {
      history = [...history, { date: today, value: updated.currentValue }]
    }
  }

  saveAssets(userId, assets.map(a =>
    a.id === updated.id ? { ...updated, history, lastUpdated: today } : a
  ))
}

export function deleteAsset(userId: string, id: string): void {
  saveAssets(userId, getAssets(userId).filter(a => a.id !== id))
}

export function getTotalByType(userId: string): Record<AssetType, number> {
  const totals = { stocks: 0, etf: 0, crypto: 0, real_estate: 0, savings: 0, super: 0 }
  getAssets(userId).forEach(a => { totals[a.type] += a.currentValue })
  return totals
}

export function getTotalNetWorth(userId: string): number {
  return getAssets(userId).reduce((sum, a) => sum + a.currentValue, 0)
}

/** Aggregate all account histories into a net worth timeline. */
export function getNetWorthHistory(userId: string): { date: string; value: number }[] {
  const assets = getAssets(userId)
  if (assets.length === 0) return []

  const allDates = new Set<string>()
  assets.forEach(a => a.history.forEach(h => allDates.add(h.date)))

  return [...allDates]
    .sort()
    .map(date => {
      const value = assets.reduce((sum, asset) => {
        const entries = asset.history.filter(h => h.date <= date).sort((a, b) => b.date.localeCompare(a.date))
        return sum + (entries[0]?.value ?? 0)
      }, 0)
      return { date, value }
    })
}
