import { getUserData, setUserData } from '../auth/users'
import type { Budget } from './types'

const KEY = 'budgets'

export function getBudgets(userId: string): Budget[] {
  return getUserData<Budget[]>(userId, KEY) ?? []
}

export function saveBudgets(userId: string, budgets: Budget[]): void {
  setUserData(userId, KEY, budgets)
}

export function addBudget(userId: string, budget: Budget): void {
  saveBudgets(userId, [...getBudgets(userId), budget])
}

export function updateBudget(userId: string, updated: Budget): void {
  saveBudgets(userId, getBudgets(userId).map(b => b.id === updated.id ? updated : b))
}

export function deleteBudget(userId: string, id: string): void {
  saveBudgets(userId, getBudgets(userId).filter(b => b.id !== id))
}
