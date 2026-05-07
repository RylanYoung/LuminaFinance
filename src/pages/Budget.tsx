import { useState } from 'react'
import { getSession } from '../auth/session'
import { getBudgetCategories, saveBudgetCategories } from '../store/budget'
import { getIncome } from '../store/income'
import { getSettings } from '../store/settings'
import { useToast } from '../hooks/useToast'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { useMounted } from '../hooks/useMounted'
import PageTransition from '../components/PageTransition'
import type { BudgetCategory } from '../store/types'

interface EditingState {
  id: string
  field: 'budget' | 'spent'
  value: string
}

export default function Budget() {
  const session = getSession()!
  const { toast } = useToast()
  const settings = getSettings(session.userId)
  const sym = settings.currencySymbol

  const [categories, setCategories] = useState<BudgetCategory[]>(() =>
    getBudgetCategories(session.userId)
  )
  const [income] = useState(() => getIncome(session.userId))
  const [editing, setEditing] = useState<EditingState | null>(null)

  const totalBudget = categories.reduce((s, c) => s + c.monthlyBudget, 0)
  const totalSpent = categories.reduce((s, c) => s + c.monthlySpent, 0)
  const monthlyIncome = income.monthlyAmount
  const surplus = monthlyIncome - totalSpent

  const animIncome = useAnimatedNumber(monthlyIncome)
  const animSpent = useAnimatedNumber(totalSpent)
  const animSurplus = useAnimatedNumber(Math.abs(surplus))
  const animBudget = useAnimatedNumber(totalBudget)
  const mounted = useMounted()

  function startEdit(cat: BudgetCategory, field: 'budget' | 'spent') {
    setEditing({
      id: cat.id,
      field,
      value: (field === 'budget' ? cat.monthlyBudget : cat.monthlySpent).toString(),
    })
  }

  function commitEdit() {
    if (!editing) return
    const num = parseFloat(editing.value)
    if (isNaN(num) || num < 0) {
      setEditing(null)
      return
    }
    const updated = categories.map(c => {
      if (c.id !== editing.id) return c
      return {
        ...c,
        monthlyBudget: editing.field === 'budget' ? num : c.monthlyBudget,
        monthlySpent: editing.field === 'spent' ? num : c.monthlySpent,
      }
    })
    saveBudgetCategories(session.userId, updated)
    setCategories(updated)
    setEditing(null)
    toast.success('Budget updated')
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(null)
  }

  const budgetPct = monthlyIncome > 0 ? Math.min((totalSpent / monthlyIncome) * 100, 100) : 0

  return (
    <PageTransition>
      <div className="p-container-padding max-w-4xl mx-auto pb-12 space-y-section-margin anim-stagger">
        {/* Header */}
        <div className="pt-2">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Monthly Budget</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Click any amount to edit it inline
          </p>
        </div>

        {/* Income vs Expenses summary */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Income vs Expenses</h3>

          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Income</p>
              <p className="font-headline-md text-headline-md text-secondary font-bold tabular-nums">
                {sym}{Math.round(animIncome).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Spent</p>
              <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
                {sym}{Math.round(animSpent).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">
                {surplus >= 0 ? 'Surplus' : 'Deficit'}
              </p>
              <p className={`font-headline-md text-headline-md font-bold tabular-nums ${
                surplus >= 0 ? 'text-secondary' : 'text-error'
              }`}>
                {surplus < 0 ? '-' : ''}{sym}{Math.round(animSurplus).toLocaleString()}
              </p>
            </div>
          </div>

          {monthlyIncome > 0 && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-label-xs text-label-xs text-on-surface-variant">
                  {budgetPct.toFixed(1)}% of income spent
                </span>
                {totalBudget > 0 && (
                  <span className="font-label-xs text-label-xs text-on-surface-variant">
                    Budget: {sym}{totalBudget.toLocaleString()}
                  </span>
                )}
              </div>
              <div className="w-full bg-surface-container-high rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-700 ${
                    budgetPct >= 100 ? 'bg-error' : budgetPct >= 85 ? 'bg-amber-400' : 'teal-gradient'
                  }`}
                  style={{ width: `${mounted ? budgetPct : 0}%` }}
                />
              </div>
            </div>
          )}

          {monthlyIncome === 0 && (
            <p className="font-label-xs text-label-xs text-on-surface-variant">
              Set your income on the Income page to see budget ratios
            </p>
          )}
        </div>

        {/* Categories */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-md text-headline-md text-on-surface">Categories</h3>
              <p className="font-label-xs text-label-xs text-on-surface-variant">
                Click to edit budget or spent
              </p>
            </div>
          </div>

          <div className="divide-y divide-outline-variant/20">
            {categories.map(cat => {
              const pct = cat.monthlyBudget > 0
                ? Math.min((cat.monthlySpent / cat.monthlyBudget) * 100, 100)
                : 0
              const over = cat.monthlyBudget > 0 && cat.monthlySpent > cat.monthlyBudget
              const warn = !over && cat.monthlyBudget > 0 && pct >= 85

              const editingBudget = editing?.id === cat.id && editing.field === 'budget'
              const editingSpent = editing?.id === cat.id && editing.field === 'spent'

              return (
                <div key={cat.id} className="px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ color: cat.color }}
                      >
                        {cat.icon}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-label-sm text-label-sm text-on-surface font-medium mb-2">{cat.name}</p>

                      {cat.monthlyBudget > 0 && (
                        <div className="mb-2">
                          <div className="w-full bg-surface-container-high rounded-full h-1.5">
                            <div
                              className={`h-1.5 rounded-full transition-all duration-700 ${
                                over ? 'bg-error' : warn ? 'bg-amber-400' : 'bg-secondary'
                              }`}
                              style={{ width: `${mounted ? pct : 0}%` }}
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        {/* Budget field */}
                        <div className="flex items-center gap-1">
                          <span className="font-label-xs text-label-xs text-on-surface-variant">Budget:</span>
                          {editingBudget ? (
                            <div className="flex items-center gap-1">
                              <span className="font-label-xs text-label-xs text-on-surface-variant">{sym}</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                autoFocus
                                value={editing.value}
                                onChange={e => setEditing(ed => ed ? { ...ed, value: e.target.value } : null)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                className="w-24 bg-surface-container rounded px-2 py-0.5 font-label-xs text-label-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(cat, 'budget')}
                              className={`font-label-xs text-label-xs tabular-nums hover:text-secondary transition-colors ${
                                cat.monthlyBudget > 0 ? 'text-on-surface' : 'text-outline border-b border-dashed border-outline'
                              }`}
                            >
                              {cat.monthlyBudget > 0 ? `${sym}${cat.monthlyBudget.toLocaleString()}` : '+ Set'}
                            </button>
                          )}
                        </div>

                        <div className="text-on-surface-variant font-label-xs text-label-xs">·</div>

                        {/* Spent field */}
                        <div className="flex items-center gap-1">
                          <span className="font-label-xs text-label-xs text-on-surface-variant">Spent:</span>
                          {editingSpent ? (
                            <div className="flex items-center gap-1">
                              <span className="font-label-xs text-label-xs text-on-surface-variant">{sym}</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                autoFocus
                                value={editing.value}
                                onChange={e => setEditing(ed => ed ? { ...ed, value: e.target.value } : null)}
                                onBlur={commitEdit}
                                onKeyDown={handleKeyDown}
                                className="w-24 bg-surface-container rounded px-2 py-0.5 font-label-xs text-label-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-secondary/50"
                              />
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(cat, 'spent')}
                              className={`font-label-xs text-label-xs tabular-nums hover:text-secondary transition-colors ${
                                cat.monthlySpent > 0
                                  ? over ? 'text-error' : warn ? 'text-amber-500' : 'text-on-surface'
                                  : 'text-outline border-b border-dashed border-outline'
                              }`}
                            >
                              {cat.monthlySpent > 0 ? `${sym}${cat.monthlySpent.toLocaleString()}` : '+ Add'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Over budget badge */}
                    {over && (
                      <div className="shrink-0 text-right">
                        <span className="font-label-xs text-label-xs text-error bg-error-container px-2 py-0.5 rounded-full">
                          +{sym}{(cat.monthlySpent - cat.monthlyBudget).toLocaleString()} over
                        </span>
                      </div>
                    )}
                    {!over && cat.monthlyBudget > 0 && (
                      <div className="shrink-0 text-right">
                        <span className={`font-label-xs text-label-xs tabular-nums ${warn ? 'text-amber-500' : 'text-on-surface-variant'}`}>
                          {pct.toFixed(0)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Total row */}
          <div className="px-5 py-4 bg-surface-container border-t border-outline-variant/30 flex items-center justify-between">
            <span className="font-label-sm text-label-sm text-on-surface font-semibold">Total</span>
            <div className="flex gap-8 text-right">
              <div>
                <p className="font-label-xs text-label-xs text-on-surface-variant">Budget</p>
                <p className="font-label-sm text-label-sm text-on-surface font-semibold tabular-nums">
                  {sym}{Math.round(animBudget).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="font-label-xs text-label-xs text-on-surface-variant">Spent</p>
                <p className={`font-label-sm text-label-sm font-semibold tabular-nums ${
                  totalBudget > 0 && totalSpent > totalBudget ? 'text-error' : 'text-on-surface'
                }`}>
                  {sym}{Math.round(animSpent).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
