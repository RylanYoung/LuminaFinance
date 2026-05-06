import { getUserData, setUserData } from '../auth/users'
import type { Category } from './types'

const KEY = 'categories'

export const DEFAULT_CATEGORIES: Category[] = [
  // Expense
  { id: 'cat-food', name: 'Food & Dining', icon: 'restaurant', color: '#F59E0B', type: 'expense', isDefault: true },
  { id: 'cat-shopping', name: 'Shopping', icon: 'shopping_bag', color: '#8B5CF6', type: 'expense', isDefault: true },
  { id: 'cat-housing', name: 'Housing', icon: 'home', color: '#3B82F6', type: 'expense', isDefault: true },
  { id: 'cat-transport', name: 'Transportation', icon: 'directions_car', color: '#6B7280', type: 'expense', isDefault: true },
  { id: 'cat-health', name: 'Health', icon: 'favorite', color: '#EF4444', type: 'expense', isDefault: true },
  { id: 'cat-entertainment', name: 'Entertainment', icon: 'movie', color: '#EC4899', type: 'expense', isDefault: true },
  { id: 'cat-travel', name: 'Travel', icon: 'flight', color: '#14B8A6', type: 'expense', isDefault: true },
  { id: 'cat-education', name: 'Education', icon: 'school', color: '#F97316', type: 'expense', isDefault: true },
  { id: 'cat-bills', name: 'Bills & Utilities', icon: 'bolt', color: '#84CC16', type: 'expense', isDefault: true },
  { id: 'cat-other-exp', name: 'Other', icon: 'more_horiz', color: '#9CA3AF', type: 'expense', isDefault: true },
  // Income
  { id: 'cat-salary', name: 'Salary', icon: 'payments', color: '#006a61', type: 'income', isDefault: true },
  { id: 'cat-freelance', name: 'Freelance', icon: 'laptop', color: '#0D9488', type: 'income', isDefault: true },
  { id: 'cat-investment', name: 'Investment', icon: 'trending_up', color: '#0F172A', type: 'income', isDefault: true },
  { id: 'cat-business', name: 'Business', icon: 'business', color: '#1E40AF', type: 'income', isDefault: true },
  { id: 'cat-gift', name: 'Gift', icon: 'card_giftcard', color: '#DB2777', type: 'income', isDefault: true },
  { id: 'cat-other-inc', name: 'Other Income', icon: 'attach_money', color: '#64748B', type: 'income', isDefault: true },
]

export function getCategories(userId: string): Category[] {
  const stored = getUserData<Category[]>(userId, KEY)
  if (!stored || stored.length === 0) {
    setUserData(userId, KEY, DEFAULT_CATEGORIES)
    return DEFAULT_CATEGORIES
  }
  return stored
}

export function saveCategories(userId: string, cats: Category[]): void {
  setUserData(userId, KEY, cats)
}

export function addCategory(userId: string, cat: Category): void {
  saveCategories(userId, [...getCategories(userId), cat])
}

export function updateCategory(userId: string, updated: Category): void {
  saveCategories(userId, getCategories(userId).map(c => c.id === updated.id ? updated : c))
}

export function deleteCategory(userId: string, id: string): void {
  saveCategories(userId, getCategories(userId).filter(c => c.id !== id))
}

export function getCategoryById(userId: string, id: string): Category | undefined {
  return getCategories(userId).find(c => c.id === id)
}
