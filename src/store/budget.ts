import { getUserData, setUserData } from '../auth/users'
import { generateId } from '../utils'
import type { BudgetCategory } from './types'

const KEY = 'budget_v2'

const DEFAULTS: BudgetCategory[] = [
  { id: 'bc-housing',       name: 'Housing',        icon: 'home',           color: '#3B82F6', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-food',          name: 'Food & Dining',  icon: 'restaurant',     color: '#F59E0B', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-transport',     name: 'Transport',      icon: 'directions_car', color: '#6B7280', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-health',        name: 'Health',         icon: 'favorite',       color: '#EF4444', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-entertainment', name: 'Entertainment',  icon: 'movie',          color: '#EC4899', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-shopping',      name: 'Shopping',       icon: 'shopping_bag',   color: '#8B5CF6', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-utilities',     name: 'Utilities',      icon: 'bolt',           color: '#84CC16', monthlyBudget: 0, monthlySpent: 0 },
  { id: 'bc-other',         name: 'Other',          icon: 'more_horiz',     color: '#9CA3AF', monthlyBudget: 0, monthlySpent: 0 },
]

export function getBudgetCategories(userId: string): BudgetCategory[] {
  const stored = getUserData<BudgetCategory[]>(userId, KEY)
  if (!stored || stored.length === 0) {
    setUserData(userId, KEY, DEFAULTS)
    return [...DEFAULTS]
  }
  return stored
}

export function saveBudgetCategories(userId: string, cats: BudgetCategory[]): void {
  setUserData(userId, KEY, cats)
}

export function addBudgetCategory(userId: string, cat: Omit<BudgetCategory, 'id'>): void {
  saveBudgetCategories(userId, [...getBudgetCategories(userId), { ...cat, id: generateId() }])
}

export function updateBudgetCategory(userId: string, updated: BudgetCategory): void {
  saveBudgetCategories(userId, getBudgetCategories(userId).map(c => c.id === updated.id ? updated : c))
}

export function deleteBudgetCategory(userId: string, id: string): void {
  saveBudgetCategories(userId, getBudgetCategories(userId).filter(c => c.id !== id))
}

export function getTotalMonthlyExpenses(userId: string): number {
  return getBudgetCategories(userId).reduce((s, c) => s + c.monthlySpent, 0)
}

export function getTotalMonthlyBudget(userId: string): number {
  return getBudgetCategories(userId).reduce((s, c) => s + c.monthlyBudget, 0)
}
