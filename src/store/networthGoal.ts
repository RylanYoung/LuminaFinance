import { getUserData, setUserData } from '../auth/users'
import type { NetWorthGoal } from './types'

const KEY = 'networth_goal'

export function getNetWorthGoal(userId: string): NetWorthGoal | null {
  return getUserData<NetWorthGoal>(userId, KEY)
}

export function saveNetWorthGoal(userId: string, goal: NetWorthGoal): void {
  setUserData(userId, KEY, goal)
}
