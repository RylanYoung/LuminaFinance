export interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  categoryId: string
  description: string
  date: string // YYYY-MM-DD
  notes?: string
  isRecurringTemplate?: boolean
  recurringFrequency?: 'monthly' | 'weekly'
  recurringDay?: number // day of month (1-31) for monthly; 0-6 (Sun-Sat) for weekly
  recurringSourceId?: string
}

export interface Category {
  id: string
  name: string
  icon: string
  color: string // hex
  type: 'income' | 'expense' | 'both'
  isDefault?: boolean
}

export interface Budget {
  id: string
  categoryId: string
  amount: number
  period: 'monthly'
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string // YYYY-MM-DD
  icon: string
  color: string
  createdAt: string
}

export interface AppSettings {
  currency: string
  currencySymbol: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
}
