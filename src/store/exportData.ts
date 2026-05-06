import { getTransactions, saveTransactions } from './transactions'
import { getCategories, saveCategories } from './categories'
import { getBudgets, saveBudgets } from './budgets'
import { getGoals, saveGoals } from './goals'
import { getSettings, saveSettings } from './settings'

export interface ExportPayload {
  version: 1
  exportedAt: string
  transactions: ReturnType<typeof getTransactions>
  categories: ReturnType<typeof getCategories>
  budgets: ReturnType<typeof getBudgets>
  goals: ReturnType<typeof getGoals>
  settings: ReturnType<typeof getSettings>
}

export function exportAllData(userId: string): string {
  const payload: ExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: getTransactions(userId),
    categories: getCategories(userId),
    budgets: getBudgets(userId),
    goals: getGoals(userId),
    settings: getSettings(userId),
  }
  return JSON.stringify(payload, null, 2)
}

export function importAllData(userId: string, json: string): void {
  const payload = JSON.parse(json) as ExportPayload
  if (payload.version !== 1) throw new Error('Unsupported export version')
  saveTransactions(userId, payload.transactions)
  saveCategories(userId, payload.categories)
  saveBudgets(userId, payload.budgets)
  saveGoals(userId, payload.goals)
  saveSettings(userId, payload.settings)
}
