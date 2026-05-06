import { getUserData, setUserData } from '../auth/users'
import { getTransactions, saveTransactions } from './transactions'
import { generateId } from '../utils'
import type { Transaction } from './types'

const LAST_CHECK_KEY = 'last_recurring_check'

export function processRecurring(userId: string): number {
  const now = new Date()
  const currentKey = `${now.getFullYear()}-${now.getMonth()}`
  const lastKey = getUserData<string>(userId, LAST_CHECK_KEY) ?? ''

  if (lastKey === currentKey) return 0

  const transactions = getTransactions(userId)
  const templates = transactions.filter(t => t.isRecurringTemplate)
  const generated: Transaction[] = []

  for (const tpl of templates) {
    if (tpl.recurringFrequency === 'monthly') {
      const day = tpl.recurringDay ?? 1
      const targetDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(Math.min(day, new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())).padStart(2, '0')}`
      const alreadyExists = transactions.some(
        t => t.recurringSourceId === tpl.id && t.date.startsWith(targetDate.slice(0, 7)),
      )
      if (!alreadyExists) {
        generated.push({
          ...tpl,
          id: generateId(),
          date: targetDate,
          isRecurringTemplate: false,
          recurringSourceId: tpl.id,
          recurringFrequency: undefined,
          recurringDay: undefined,
        })
      }
    }
  }

  if (generated.length > 0) {
    saveTransactions(userId, [...generated, ...transactions])
  }

  setUserData(userId, LAST_CHECK_KEY, currentKey)
  return generated.length
}
