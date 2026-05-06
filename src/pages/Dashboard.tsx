import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../auth/session'
import { getTransactions, getTotalIncome, getTotalExpenses } from '../store/transactions'
import { getCategoryById, getCategories } from '../store/categories'
import { getBudgets } from '../store/budgets'
import { getGoals } from '../store/goals'
import { formatCurrency, formatDate } from '../utils'
import { useAnimatedNumber } from '../hooks/useAnimatedNumber'
import { SkeletonCard, SkeletonRow } from '../components/SkeletonCard'
import TransactionModal from '../components/TransactionModal'
import PageTransition from '../components/PageTransition'
import type { Transaction } from '../store/types'

function AnimatedCurrency({ value, symbol = '$' }: { value: number; symbol?: string }) {
  const animated = useAnimatedNumber(value)
  return <>{symbol}{animated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
}

function AnimatedBar({ pct, className }: { pct: number; className: string }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const id = setTimeout(() => setWidth(Math.min(pct, 100)), 100)
    return () => clearTimeout(id)
  }, [pct])
  return (
    <div className="h-2 rounded-full bg-surface-container-highest overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ease-out ${className}`} style={{ width: `${width}%` }} />
    </div>
  )
}

export default function Dashboard() {
  const session = getSession()!
  const navigate = useNavigate()
  const now = new Date()
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const [data, setData] = useState({
    income: 0,
    expenses: 0,
    netWorth: 0,
    recentTx: [] as Transaction[],
    budgetProgress: [] as { name: string; icon: string; color: string; spent: number; budget: number }[],
    goalProgress: [] as { name: string; icon: string; color: string; current: number; target: number }[],
  })

  useEffect(() => {
    setLoading(true)
    const uid = session.userId
    const income = getTotalIncome(uid, now.getFullYear(), now.getMonth())
    const expenses = getTotalExpenses(uid, now.getFullYear(), now.getMonth())
    const allTx = getTransactions(uid)
    const totalIncome = allTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const totalExpenses = allTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const netWorth = totalIncome - totalExpenses

    const recentTx = [...allTx]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)

    const budgets = getBudgets(uid)
    const cats = getCategories(uid)
    const budgetProgress = budgets.map(b => {
      const cat = cats.find(c => c.id === b.categoryId)
      const spent = allTx
        .filter(t => t.categoryId === b.categoryId && t.type === 'expense' &&
          new Date(t.date + 'T00:00:00').getFullYear() === now.getFullYear() &&
          new Date(t.date + 'T00:00:00').getMonth() === now.getMonth())
        .reduce((s, t) => s + t.amount, 0)
      return { name: cat?.name ?? 'Unknown', icon: cat?.icon ?? 'help', color: cat?.color ?? '#ccc', spent, budget: b.amount }
    }).slice(0, 4)

    const goals = getGoals(uid)
    const goalProgress = goals.map(g => ({
      name: g.name,
      icon: g.icon,
      color: g.color,
      current: g.currentAmount,
      target: g.targetAmount,
    })).slice(0, 3)

    setData({ income, expenses, netWorth, recentTx, budgetProgress, goalProgress })
    setTimeout(() => setLoading(false), 400)
  }, [refresh])

  if (loading) {
    return (
      <PageTransition>
        <div className="p-container-padding max-w-7xl mx-auto space-y-section-margin">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <SkeletonCard className="md:col-span-8 h-56" />
            <div className="md:col-span-4 flex flex-col gap-gutter">
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
          <SkeletonCard>
            {[1,2,3,4].map(i => <SkeletonRow key={i} />)}
          </SkeletonCard>
        </div>
      </PageTransition>
    )
  }

  const { income, expenses, netWorth, recentTx, budgetProgress, goalProgress } = data
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0

  return (
    <PageTransition>
      <div className="p-container-padding max-w-7xl mx-auto space-y-section-margin">
        {/* Top greeting + add btn */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Good {now.getHours() < 12 ? 'morning' : now.getHours() < 18 ? 'afternoon' : 'evening'}, {session.name.split(' ')[0]}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Here's your financial snapshot for {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="teal-gradient text-white px-5 py-3 rounded-xl font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Transaction
          </button>
        </div>

        {/* KPI grid */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          {/* Net Worth card */}
          <div className="md:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/5 rounded-full -mr-20 -mt-20 blur-3xl group-hover:bg-secondary/8 transition-colors" />
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Total Net Worth</p>
            <h3 className="font-display-xl text-display-xl text-primary">
              <AnimatedCurrency value={netWorth} />
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className={`font-label-sm text-label-sm flex items-center gap-0.5 ${netWorth >= 0 ? 'text-secondary' : 'text-error'}`}>
                <span className="material-symbols-outlined text-[16px]">{netWorth >= 0 ? 'trending_up' : 'trending_down'}</span>
                {savingsRate}% savings rate
              </span>
              <span className="text-on-surface-variant font-label-xs text-label-xs">this month</span>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4 border-t border-outline-variant/30 pt-6">
              <div>
                <div className="w-3 h-3 rounded-full bg-secondary mb-2" />
                <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Monthly Income</p>
                <p className="font-headline-md text-headline-md text-on-surface mt-1">
                  <AnimatedCurrency value={income} />
                </p>
              </div>
              <div>
                <div className="w-3 h-3 rounded-full bg-error mb-2" />
                <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">Monthly Expenses</p>
                <p className="font-headline-md text-headline-md text-on-surface mt-1">
                  <AnimatedCurrency value={expenses} />
                </p>
              </div>
            </div>
          </div>

          {/* Side cards */}
          <div className="md:col-span-4 flex flex-col gap-gutter">
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Net Income</p>
              <p className={`font-headline-lg text-headline-lg ${income - expenses >= 0 ? 'text-secondary' : 'text-error'}`}>
                {income - expenses >= 0 ? '+' : ''}<AnimatedCurrency value={income - expenses} />
              </p>
              <div className="mt-4">
                <AnimatedBar pct={income > 0 ? (income - expenses) / income * 100 : 0} className="teal-gradient" />
              </div>
              <p className="font-label-xs text-label-xs text-on-surface-variant mt-2">{savingsRate}% of income saved</p>
            </div>
            <div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
              <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Transactions</p>
              <p className="font-headline-lg text-headline-lg text-on-surface">{recentTx.length > 0 ? getTransactions(session.userId).length : 0}</p>
              <p className="font-label-xs text-label-xs text-on-surface-variant mt-1">total recorded</p>
              <button
                onClick={() => navigate('/transactions')}
                className="mt-4 flex items-center gap-1 text-secondary font-label-sm text-label-sm hover:underline"
              >
                View all <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>

        {/* Recent transactions + budgets side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
          {/* Recent transactions */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Recent Transactions</h3>
              <button onClick={() => navigate('/transactions')} className="font-label-sm text-label-sm text-secondary hover:underline">
                View all
              </button>
            </div>
            {recentTx.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="material-symbols-outlined text-outline text-[40px] mb-3">receipt_long</span>
                <p className="font-body-md text-body-md text-on-surface-variant">No transactions yet</p>
                <button onClick={() => setShowModal(true)} className="mt-3 text-secondary font-label-sm text-label-sm hover:underline">
                  Add your first transaction
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTx.map(tx => {
                  const cat = getCategoryById(session.userId, tx.categoryId)
                  return (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-outline-variant/20 last:border-0 hover:bg-surface-container-low -mx-2 px-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color}20` }}>
                          <span className="material-symbols-outlined text-[20px]" style={{ color: cat?.color }}>{cat?.icon ?? 'payments'}</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface font-medium">{tx.description}</p>
                          <p className="font-label-xs text-label-xs text-on-surface-variant">{cat?.name} · {formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <span className={`font-label-sm text-label-sm font-semibold ${tx.type === 'income' ? 'text-secondary' : 'text-on-surface'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Budget overview */}
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Budgets</h3>
              <button onClick={() => navigate('/budgets')} className="font-label-sm text-label-sm text-secondary hover:underline">
                Manage
              </button>
            </div>
            {budgetProgress.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <span className="material-symbols-outlined text-outline text-[36px] mb-2">track_changes</span>
                <p className="font-body-md text-body-md text-on-surface-variant text-sm">No budgets set</p>
                <button onClick={() => navigate('/budgets')} className="mt-2 text-secondary font-label-sm text-label-sm hover:underline">
                  Create a budget
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetProgress.map(b => {
                  const pct = b.budget > 0 ? Math.round((b.spent / b.budget) * 100) : 0
                  const over = pct >= 90
                  return (
                    <div key={b.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px]" style={{ color: b.color }}>{b.icon}</span>
                          <span className="font-label-sm text-label-sm text-on-surface">{b.name}</span>
                        </div>
                        <span className={`font-label-xs text-label-xs ${over ? 'text-error' : 'text-on-surface-variant'}`}>{pct}%</span>
                      </div>
                      <AnimatedBar pct={pct} className={over ? 'bg-gradient-to-r from-error to-red-400' : 'teal-gradient'} />
                      <p className="font-label-xs text-label-xs text-on-surface-variant mt-1">
                        {formatCurrency(b.spent)} of {formatCurrency(b.budget)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Goals */}
        {goalProgress.length > 0 && (
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Savings Goals</h3>
              <button onClick={() => navigate('/budgets')} className="font-label-sm text-label-sm text-secondary hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {goalProgress.map(g => {
                const pct = g.target > 0 ? Math.round((g.current / g.target) * 100) : 0
                return (
                  <div key={g.name} className="p-4 rounded-xl bg-surface-container">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${g.color}20` }}>
                        <span className="material-symbols-outlined text-[18px]" style={{ color: g.color }}>{g.icon}</span>
                      </div>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface font-medium">{g.name}</p>
                        <p className="font-label-xs text-label-xs text-on-surface-variant">{pct}% complete</p>
                      </div>
                    </div>
                    <AnimatedBar pct={pct} className="teal-gradient" />
                    <div className="flex justify-between mt-2">
                      <span className="font-label-xs text-label-xs text-secondary">{formatCurrency(g.current)}</span>
                      <span className="font-label-xs text-label-xs text-on-surface-variant">{formatCurrency(g.target)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>

      {showModal && (
        <TransactionModal
          userId={session.userId}
          onClose={() => setShowModal(false)}
          onSaved={() => setRefresh(r => r + 1)}
        />
      )}
    </PageTransition>
  )
}
