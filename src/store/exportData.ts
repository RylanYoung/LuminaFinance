import { getAssets, saveAssets } from './assets'
import { getIncome, saveIncome } from './income'
import { getBudgetCategories, saveBudgetCategories } from './budget'
import { getNetWorthGoal, saveNetWorthGoal } from './networthGoal'
import { getSettings, saveSettings } from './settings'

export interface ExportPayload {
  version: 2
  exportedAt: string
  assets: ReturnType<typeof getAssets>
  income: ReturnType<typeof getIncome>
  budgetCategories: ReturnType<typeof getBudgetCategories>
  networthGoal: ReturnType<typeof getNetWorthGoal>
  settings: ReturnType<typeof getSettings>
}

export function exportAllData(userId: string): string {
  const payload: ExportPayload = {
    version: 2,
    exportedAt: new Date().toISOString(),
    assets: getAssets(userId),
    income: getIncome(userId),
    budgetCategories: getBudgetCategories(userId),
    networthGoal: getNetWorthGoal(userId),
    settings: getSettings(userId),
  }
  return JSON.stringify(payload, null, 2)
}

export function importAllData(userId: string, json: string): void {
  const payload = JSON.parse(json) as ExportPayload
  if (payload.version !== 2) throw new Error('Unsupported export version')
  saveAssets(userId, payload.assets)
  saveIncome(userId, payload.income)
  saveBudgetCategories(userId, payload.budgetCategories)
  if (payload.networthGoal) saveNetWorthGoal(userId, payload.networthGoal)
  saveSettings(userId, payload.settings)
}
