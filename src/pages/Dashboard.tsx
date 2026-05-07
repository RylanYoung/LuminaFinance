import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../auth/session'
import { getTotalNetWorth, getTotalByType, ASSET_META, ASSET_ORDER } from '../store/assets'
import { getIncome } from '../store/income'
import { getNetWorthGoal } from '../store/networthGoal'
import { getTotalMonthlyExpenses, getBudgetCategories } from '../store/budget'
import { getSettings } from '../store/settings'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import PageTransition from '../components/PageTransition'

export default function Dashboard() {
  const session = getSession()!
  const navigate = useNavigate()
  const settings = getSettings(session.userId)
  const sym = settings.currencySymbol

  const [netWorth] = useState(() => getTotalNetWorth(session.userId))
  const [byType] = useState(() => getTotalByType(session.userId))
  const [income] = useState(() => getIncome(session.userId))
  const [goal] = useState(() => getNetWorthGoal(session.userId))
  const [totalExpenses] = useState(() => getTotalMonthlyExpenses(session.userId))
  const [categories] = useState(() => getBudgetCategories(session.userId))
  const incomeActions = (income.actions ?? []).filter(a => a.trim().length > 0)

  const animNetWorth = useAnimatedNumber(netWorth)
  const animIncome = useAnimatedNumber(income.monthlyAmount)
  const animExpenses = useAnimatedNumber(totalExpenses)

  const goalPct = goal && goal.targetAmount > 0
    ? Math.min((netWorth / goal.targetAmount) * 100, 100)
    : null

  const surplus = income.monthlyAmount - totalExpenses

  function fmtShort(n: number) {
    if (n >= 1_000_000) return `${sym}${(n / 1_000_000).toFixed(2)}M`
    if (n >= 1_000) return `${sym}${(n / 1_000).toFixed(1)}K`
    return `${sym}${Math.round(n).toLocaleString()}`
  }

  const budgetCategories = categories.filter(c => c.monthlyBudget > 0 || c.monthlySpent > 0)

  return (
    <PageTransition>
      <div className="p-container-padding max-w-6xl mx-auto pb-12 space-y-section-margin">
        {/* Header */}
        <div className="pt-2">
          <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">
            Welcome back, {session.name.split(' ')[0]}
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Financial Overview</h2>
        </div>

        {/* Net Worth Hero */}
        <div className="teal-gradient rounded-2xl p-8 text-white shadow-ambient">
          <p className="text-white/70 font-label-xs text-label-xs uppercase tracking-widest mb-1">Total Net Worth</p>
          <div className="font-display-xl text-display-xl mb-4 tabular-nums">
            {sym}{Math.round(animNetWorth).toLocaleString()}
          </div>

          {goal && goal.targetAmount > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-white/70 font-label-xs text-label-xs">
                  Goal: {sym}{goal.targetAmount.toLocaleString()}
                  {goal.targetDate ? ` · by ${goal.targetDate}` : ''}
                </span>
                <span className="text-white font-label-xs text-label-xs font-bold">
                  {goalPct!.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all duration-1000"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="text-white/60 font-label-xs text-label-xs hover:text-white/90 transition-colors"
            >
              Set a net worth goal in Settings →
            </button>
          )}
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Monthly Income</p>
            <p className="font-headline-md text-headline-md text-secondary font-bold tabular-nums">
              {sym}{Math.round(animIncome).toLocaleString()}
            </p>
            <p className="font-label-xs text-label-xs text-on-surface-variant mt-1">
              {sym}{income.yearlyAmount.toLocaleString()} / year
            </p>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Monthly Expenses</p>
            <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
              {sym}{Math.round(animExpenses).toLocaleString()}
            </p>
            <p className="font-label-xs text-label-xs text-on-surface-variant mt-1">
              {budgetCategories.length} categories tracked
            </p>
          </div>

          <div className={`border rounded-xl p-5 shadow-ambient ${
            surplus >= 0 ? 'bg-secondary/10 border-secondary/30' : 'bg-error-container border-error/30'
          }`}>
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">
              Monthly {surplus >= 0 ? 'Surplus' : 'Deficit'}
            </p>
            <p className={`font-headline-md text-headline-md font-bold tabular-nums ${
              surplus >= 0 ? 'text-secondary' : 'text-error'
            }`}>
              {surplus < 0 ? '-' : ''}{sym}{Math.abs(Math.round(surplus)).toLocaleString()}
            </p>
            <p className="font-label-xs text-label-xs text-on-surface-variant mt-1">
              {surplus >= 0 ? 'Saving' : 'Overspending'} monthly
            </p>
          </div>
        </div>

        {/* Asset Portfolio */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Asset Portfolio</h3>
            <button
              onClick={() => navigate('/portfolio')}
              className="font-label-xs text-label-xs text-secondary hover:underline active:opacity-70"
            >
              Manage →
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-gutter">
            {ASSET_ORDER.map(type => {
              const meta = ASSET_META[type]
              const value = byType[type]
              const share = netWorth > 0 ? (value / netWorth) * 100 : 0
              return (
                <button
                  key={type}
                  onClick={() => navigate('/portfolio')}
                  className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient text-left hover:border-secondary/40 transition-all active:scale-[0.97]"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: meta.color + '20' }}
                    >
                      <span className="material-symbols-outlined text-[18px]" style={{ color: meta.color }}>
                        {meta.icon}
                      </span>
                    </div>
                    <span className="font-label-xs text-label-xs text-on-surface-variant">{meta.label}</span>
                  </div>
                  <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
                    {fmtShort(value)}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-surface-container-high rounded-full h-1">
                      <div
                        className="h-1 rounded-full transition-all duration-700"
                        style={{ width: `${share}%`, backgroundColor: meta.color }}
                      />
                    </div>
                    <span className="font-label-xs text-label-xs text-on-surface-variant tabular-nums shrink-0">
                      {share.toFixed(1)}%
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Income Strategy */}
        {incomeActions.length > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">rocket_launch</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Income Strategy</h3>
              </div>
              <button
                onClick={() => navigate('/income')}
                className="font-label-xs text-label-xs text-secondary hover:underline"
              >
                Edit →
              </button>
            </div>
            <div className="space-y-2">
              {incomeActions.map((action, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full teal-gradient flex items-center justify-center shrink-0">
                    <span className="text-white font-bold" style={{ fontSize: 10 }}>{i + 1}</span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface">{action}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Budget Health */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Budget Health</h3>
            <button
              onClick={() => navigate('/budget')}
              className="font-label-xs text-label-xs text-secondary hover:underline active:opacity-70"
            >
              Edit →
            </button>
          </div>

          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient divide-y divide-outline-variant/20">
            {budgetCategories.length > 0 ? (
              budgetCategories.slice(0, 6).map(cat => {
                const pct = cat.monthlyBudget > 0
                  ? Math.min((cat.monthlySpent / cat.monthlyBudget) * 100, 100)
                  : 0
                const over = cat.monthlyBudget > 0 && cat.monthlySpent > cat.monthlyBudget
                const warn = !over && cat.monthlyBudget > 0 && pct >= 85
                return (
                  <div key={cat.id} className="flex items-center gap-4 px-5 py-4">
                    <span
                      className="material-symbols-outlined text-[20px] shrink-0"
                      style={{ color: cat.color }}
                    >
                      {cat.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-label-sm text-label-sm text-on-surface">{cat.name}</span>
                        <span className={`font-label-xs text-label-xs ml-3 shrink-0 tabular-nums ${
                          over ? 'text-error' : warn ? 'text-amber-500' : 'text-on-surface-variant'
                        }`}>
                          {sym}{cat.monthlySpent.toLocaleString()}
                          {cat.monthlyBudget > 0 && ` / ${sym}${cat.monthlyBudget.toLocaleString()}`}
                        </span>
                      </div>
                      {cat.monthlyBudget > 0 && (
                        <div className="w-full bg-surface-container-high rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${
                              over ? 'bg-error' : warn ? 'bg-amber-400' : 'bg-secondary'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {over && (
                      <span className="material-symbols-outlined text-error text-[16px] shrink-0">warning</span>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <span className="material-symbols-outlined text-outline text-[32px] block mb-2">pie_chart</span>
                <p className="font-body-md text-body-md text-on-surface-variant mb-1">No budget data yet</p>
                <button
                  onClick={() => navigate('/budget')}
                  className="font-label-sm text-label-sm text-secondary hover:underline"
                >
                  Set up your budget
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}
