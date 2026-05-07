export type AssetType = 'stocks' | 'etf' | 'crypto' | 'real_estate' | 'savings' | 'super'

export interface AssetHistoryEntry {
  date: string  // YYYY-MM-DD
  value: number
}

export interface AssetAccount {
  id: string
  name: string
  type: AssetType
  currentValue: number
  goalValue?: number
  notes?: string
  lastUpdated: string
  history: AssetHistoryEntry[]
}

export interface IncomeProfile {
  type: 'salary' | 'monthly'
  monthlyAmount: number
  yearlyAmount: number
  monthlyGoal?: number
  yearlyGoal?: number
  actions?: string[]
  history: { date: string; monthlyAmount: number }[]
}

export interface BudgetCategory {
  id: string
  name: string
  icon: string
  color: string
  monthlyBudget: number
  monthlySpent: number
}

export interface NetWorthGoal {
  targetAmount: number
  targetDate?: string
}

export interface AppSettings {
  currency: string
  currencySymbol: string
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
}
