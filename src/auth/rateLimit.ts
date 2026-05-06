const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 30_000 // 30 seconds

interface RateLimitRecord {
  attempts: number
  lockoutUntil: number | null
}

function key(email: string): string {
  return `lumina_rate_${email.toLowerCase()}`
}

function load(email: string): RateLimitRecord {
  try {
    const raw = localStorage.getItem(key(email))
    if (!raw) return { attempts: 0, lockoutUntil: null }
    return JSON.parse(raw) as RateLimitRecord
  } catch {
    return { attempts: 0, lockoutUntil: null }
  }
}

function save(email: string, record: RateLimitRecord): void {
  localStorage.setItem(key(email), JSON.stringify(record))
}

export function checkLockout(email: string): { locked: boolean; remainingMs: number } {
  const record = load(email)
  if (record.lockoutUntil !== null && Date.now() < record.lockoutUntil) {
    return { locked: true, remainingMs: record.lockoutUntil - Date.now() }
  }
  // Lockout expired — reset
  if (record.lockoutUntil !== null && Date.now() >= record.lockoutUntil) {
    save(email, { attempts: 0, lockoutUntil: null })
  }
  return { locked: false, remainingMs: 0 }
}

export function recordFailure(email: string): { locked: boolean; attemptsLeft: number } {
  const record = load(email)
  const attempts = record.attempts + 1
  if (attempts >= MAX_ATTEMPTS) {
    save(email, { attempts, lockoutUntil: Date.now() + LOCKOUT_MS })
    return { locked: true, attemptsLeft: 0 }
  }
  save(email, { attempts, lockoutUntil: null })
  return { locked: false, attemptsLeft: MAX_ATTEMPTS - attempts }
}

export function resetAttempts(email: string): void {
  localStorage.removeItem(key(email))
}
