const USERS_KEY = 'lumina_users'

export interface User {
  id: string
  email: string
  name: string
  passwordHash: string
  createdAt: number
}

export function getUsers(): User[] {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as User[]
  } catch {
    return []
  }
}

export function saveUser(user: User): void {
  const users = getUsers()
  users.push(user)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByEmail(email: string): User | undefined {
  return getUsers().find(u => u.email.toLowerCase() === email.toLowerCase())
}

/** Per-user namespaced localStorage helpers */
export function userKey(userId: string, key: string): string {
  return `lumina_${userId}_${key}`
}

export function getUserData<T>(userId: string, key: string): T | null {
  try {
    const raw = localStorage.getItem(userKey(userId, key))
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function setUserData<T>(userId: string, key: string, value: T): void {
  localStorage.setItem(userKey(userId, key), JSON.stringify(value))
}
