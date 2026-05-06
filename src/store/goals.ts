import { getUserData, setUserData } from '../auth/users'
import type { Goal } from './types'

const KEY = 'goals'

export function getGoals(userId: string): Goal[] {
  return getUserData<Goal[]>(userId, KEY) ?? []
}

export function saveGoals(userId: string, goals: Goal[]): void {
  setUserData(userId, KEY, goals)
}

export function addGoal(userId: string, goal: Goal): void {
  saveGoals(userId, [...getGoals(userId), goal])
}

export function updateGoal(userId: string, updated: Goal): void {
  saveGoals(userId, getGoals(userId).map(g => g.id === updated.id ? updated : g))
}

export function deleteGoal(userId: string, id: string): void {
  saveGoals(userId, getGoals(userId).filter(g => g.id !== id))
}
