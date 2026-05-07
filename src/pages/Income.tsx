import { useState } from 'react'
import { getSession } from '../auth/session'
import { getIncome, saveIncome } from '../store/income'
import { getSettings } from '../store/settings'
import { useToast } from '../hooks/useToast'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { useMounted } from '../hooks/useMounted'
import PageTransition from '../components/PageTransition'
import CurrencyInput from '../components/CurrencyInput'

export default function Income() {
  const session = getSession()!
  const { toast } = useToast()
  const settings = getSettings(session.userId)
  const sym = settings.currencySymbol

  const [profile, setProfile] = useState(() => getIncome(session.userId))
  const [monthlyInput, setMonthlyInput] = useState(profile.monthlyAmount.toString())
  const [monthlyGoalInput, setMonthlyGoalInput] = useState(profile.monthlyGoal?.toString() ?? '')
  const [yearlyGoalInput, setYearlyGoalInput] = useState(profile.yearlyGoal?.toString() ?? '')
  const [incomeType, setIncomeType] = useState<'salary' | 'monthly'>(profile.type)
  const [actions, setActions] = useState<string[]>(profile.actions ?? ['', '', ''])
  const [dirty, setDirty] = useState(false)
  const [actionsDirty, setActionsDirty] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const animMonthly = useAnimatedNumber(profile.monthlyAmount)
  const animYearly = useAnimatedNumber(profile.yearlyAmount)
  const mounted = useMounted()

  const monthlyGoalPct = profile.monthlyGoal && profile.monthlyGoal > 0
    ? Math.min((profile.monthlyAmount / profile.monthlyGoal) * 100, 100)
    : null

  const yearlyGoalPct = profile.yearlyGoal && profile.yearlyGoal > 0
    ? Math.min((profile.yearlyAmount / profile.yearlyGoal) * 100, 100)
    : null

  function validate() {
    const e: Record<string, string> = {}
    const monthly = Number(monthlyInput)
    if (!monthlyInput || isNaN(monthly) || monthly < 0) e.monthly = 'Enter a valid amount'
    if (monthlyGoalInput && (isNaN(Number(monthlyGoalInput)) || Number(monthlyGoalInput) < 0))
      e.monthlyGoal = 'Enter a valid goal'
    if (yearlyGoalInput && (isNaN(Number(yearlyGoalInput)) || Number(yearlyGoalInput) < 0))
      e.yearlyGoal = 'Enter a valid goal'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    const monthly = Number(monthlyInput)
    const updated = {
      ...profile,
      type: incomeType,
      monthlyAmount: monthly,
      yearlyAmount: monthly * 12,
      monthlyGoal: monthlyGoalInput ? Number(monthlyGoalInput) : undefined,
      yearlyGoal: yearlyGoalInput ? Number(yearlyGoalInput) : undefined,
      actions: profile.actions,
    }
    saveIncome(session.userId, updated)
    setProfile(updated)
    setDirty(false)
    toast.success('Income updated')
  }

  function handleSaveActions() {
    const cleaned = actions.map(a => a.trim()).filter(a => a.length > 0)
    const updated = { ...profile, actions: cleaned }
    saveIncome(session.userId, updated)
    setProfile(updated)
    setActionsDirty(false)
    toast.success('Income strategy saved')
  }

  function updateAction(i: number, val: string) {
    const next = [...actions]
    next[i] = val
    setActions(next)
    setActionsDirty(true)
  }

  const history = [...(profile.history ?? [])].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)

  return (
    <PageTransition>
      <div className="p-container-padding max-w-3xl mx-auto pb-12 space-y-section-margin anim-stagger">
        {/* Header */}
        <div className="pt-2">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Income</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Track your earnings and set financial goals
          </p>
        </div>

        {/* Hero stats */}
        <div className="grid grid-cols-2 gap-gutter">
          <div className="teal-gradient rounded-xl p-5 text-white shadow-ambient">
            <p className="text-white/70 font-label-xs text-label-xs uppercase tracking-widest mb-1">Monthly</p>
            <p className="font-display-xl text-display-xl tabular-nums">
              {sym}{Math.round(animMonthly).toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Yearly</p>
            <p className="font-display-xl text-display-xl text-on-surface tabular-nums">
              {sym}{Math.round(animYearly).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Goal progress */}
        {(monthlyGoalPct !== null || yearlyGoalPct !== null) && (
          <div className="grid grid-cols-1 gap-gutter">
            {monthlyGoalPct !== null && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">Monthly Goal</span>
                  <span className="font-label-xs text-label-xs text-secondary font-bold">
                    {monthlyGoalPct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full teal-gradient transition-all duration-1000"
                    style={{ width: `${mounted ? monthlyGoalPct : 0}%` }}
                  />
                </div>
                <p className="font-label-xs text-label-xs text-on-surface-variant">
                  {sym}{profile.monthlyAmount.toLocaleString()} of {sym}{profile.monthlyGoal!.toLocaleString()} / month
                </p>
              </div>
            )}
            {yearlyGoalPct !== null && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label-sm text-label-sm text-on-surface font-medium">Yearly Goal</span>
                  <span className="font-label-xs text-label-xs text-secondary font-bold">
                    {yearlyGoalPct.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-surface-container-high rounded-full h-2 mb-2">
                  <div
                    className="h-2 rounded-full teal-gradient transition-all duration-1000"
                    style={{ width: `${mounted ? yearlyGoalPct : 0}%` }}
                  />
                </div>
                <p className="font-label-xs text-label-xs text-on-surface-variant">
                  {sym}{profile.yearlyAmount.toLocaleString()} of {sym}{profile.yearlyGoal!.toLocaleString()} / year
                </p>
              </div>
            )}
          </div>
        )}

        {/* Edit form */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-on-surface">Update Income</h3>
          </div>
          <div className="p-6 space-y-5">
            {/* Income type toggle */}
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-2 block">
                Income Type
              </label>
              <div className="flex gap-2">
                {(['salary', 'monthly'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => { setIncomeType(t); setDirty(true) }}
                    className={`flex-1 py-2.5 rounded-lg font-label-sm text-label-sm transition-all active:scale-95 ${
                      incomeType === t
                        ? 'teal-gradient text-white shadow-ambient'
                        : 'bg-surface-container border border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    {t === 'salary' ? 'Salary (Yearly)' : 'Monthly Earnings'}
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly amount */}
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
                {incomeType === 'salary' ? 'Monthly Take-Home' : 'Monthly Earnings'}
              </label>
              <CurrencyInput
                sym={sym}
                value={monthlyInput}
                onChange={v => { setMonthlyInput(v); setDirty(true) }}
              />
              {errors.monthly && <p className="text-error font-label-xs text-label-xs mt-1">{errors.monthly}</p>}
              {monthlyInput && !isNaN(Number(monthlyInput)) && (
                <p className="font-label-xs text-label-xs text-on-surface-variant mt-1">
                  = {sym}{(Number(monthlyInput) * 12).toLocaleString()} / year
                </p>
              )}
            </div>

            {/* Goals */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
                  Monthly Goal
                </label>
                <CurrencyInput
                  sym={sym}
                  value={monthlyGoalInput}
                  onChange={v => { setMonthlyGoalInput(v); setDirty(true) }}
                  placeholder="Optional"
                />
                {errors.monthlyGoal && (
                  <p className="text-error font-label-xs text-label-xs mt-1">{errors.monthlyGoal}</p>
                )}
              </div>
              <div>
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
                  Yearly Goal
                </label>
                <CurrencyInput
                  sym={sym}
                  value={yearlyGoalInput}
                  onChange={v => { setYearlyGoalInput(v); setDirty(true) }}
                  placeholder="Optional"
                />
                {errors.yearlyGoal && (
                  <p className="text-error font-label-xs text-label-xs mt-1">{errors.yearlyGoal}</p>
                )}
              </div>
            </div>

            {dirty && (
              <button
                onClick={handleSave}
                className="w-full teal-gradient text-white py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
              >
                Save Income
              </button>
            )}
          </div>
        </section>

        {/* Income strategy */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-on-surface">Income Strategy</h3>
            <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
              What are you doing to grow your income? (up to 3 — shown on Dashboard)
            </p>
          </div>
          <div className="p-6 space-y-3">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full teal-gradient flex items-center justify-center shrink-0">
                  <span className="text-white font-bold" style={{ fontSize: 11 }}>{i + 1}</span>
                </div>
                <input
                  type="text"
                  placeholder={
                    i === 0 ? 'e.g. Freelancing on weekends'
                    : i === 1 ? 'e.g. Learning a new skill'
                    : 'e.g. Growing investment portfolio'
                  }
                  value={actions[i] ?? ''}
                  onChange={e => updateAction(i, e.target.value)}
                  className="flex-1 bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
            ))}
            {actionsDirty && (
              <button
                onClick={handleSaveActions}
                className="w-full teal-gradient text-white py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform mt-2"
              >
                Save Strategy
              </button>
            )}
          </div>
        </section>

        {/* Income history */}
        {history.length > 1 && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
            <div className="px-6 py-4 border-b border-outline-variant/30">
              <h3 className="font-headline-md text-headline-md text-on-surface">Income History</h3>
            </div>
            <div className="divide-y divide-outline-variant/20">
              {history.map((h, i) => {
                const prev = history[i + 1]
                const diff = prev ? h.monthlyAmount - prev.monthlyAmount : 0
                return (
                  <div key={h.date} className="flex items-center justify-between px-6 py-4">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{h.date}</span>
                    <div className="text-right">
                      <span className="font-label-sm text-label-sm text-on-surface font-medium tabular-nums">
                        {sym}{h.monthlyAmount.toLocaleString()} / mo
                      </span>
                      {diff !== 0 && (
                        <span className={`block font-label-xs text-label-xs tabular-nums ${diff > 0 ? 'text-secondary' : 'text-error'}`}>
                          {diff > 0 ? '+' : ''}{sym}{Math.abs(diff).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </PageTransition>
  )
}
