export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

export function formatCurrency(amount: number, symbol = '$'): string {
  return `${symbol}${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateStr: string, format = 'MMM D, YYYY'): string {
  const d = new Date(dateStr + 'T00:00:00')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  if (format === 'MMM D, YYYY') return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
  if (format === 'MMM YYYY') return `${months[d.getMonth()]} ${d.getFullYear()}`
  if (format === 'YYYY-MM-DD') return dateStr
  return dateStr
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function monthKey(date = new Date()): string {
  return `${date.getFullYear()}-${date.getMonth()}`
}

export function isSameMonth(dateStr: string, ref = new Date()): boolean {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
}

export function startOfMonth(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

export function endOfMonth(year: number, month: number): string {
  const last = new Date(year, month + 1, 0)
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`
}
