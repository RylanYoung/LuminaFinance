import { getUserData, setUserData } from '../auth/users'
import type { Transaction } from './types'

const KEY = 'transactions'

export function getTransactions(userId: string): Transaction[] {
  return getUserData<Transaction[]>(userId, KEY) ?? []
}

export function saveTransactions(userId: string, txs: Transaction[]): void {
  setUserData(userId, KEY, txs)
}

export function addTransaction(userId: string, tx: Transaction): void {
  saveTransactions(userId, [tx, ...getTransactions(userId)])
}

export function updateTransaction(userId: string, updated: Transaction): void {
  saveTransactions(userId, getTransactions(userId).map(t => t.id === updated.id ? updated : t))
}

export function deleteTransaction(userId: string, id: string): void {
  saveTransactions(userId, getTransactions(userId).filter(t => t.id !== id))
}

export function getTransactionsByMonth(userId: string, year: number, month: number): Transaction[] {
  return getTransactions(userId).filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d.getFullYear() === year && d.getMonth() === month
  })
}

export function getTotalIncome(userId: string, year: number, month: number): number {
  return getTransactionsByMonth(userId, year, month)
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getTotalExpenses(userId: string, year: number, month: number): number {
  return getTransactionsByMonth(userId, year, month)
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
}
