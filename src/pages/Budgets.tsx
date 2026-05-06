import { useState, useEffect } from 'react'
import { getSession } from '../auth/session'
import { getTransactions } from '../store/transactions'
import { getCategories } from '../store/categories'
import { getBudgets, addBudget, updateBudget, deleteBudget } from '../store/budgets'
import { getGoals, addGoal, updateGoal, deleteGoal } from '../store/goals'
import { formatCurrency, formatDate, generateId, todayISO } from '../utils'
import { useToast } from '../hooks/useToast'
import EmptyState from '../components/EmptyState'
import PageTransition from '../components/PageTransition'
import type { Budget, Goal, Category } from '../store/types'

function AnimatedBar({ pct, className }: { pct: number; className: string }) {
  const [w, setW] = useState(0)
  useEffect(() => { const id = setTimeout(() => setW(Math.min(pct, 100)), 80); return () => clearTimeout(id) }, [pct])
  return (
    <div className="h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-1000 ease-out ${className}`} style={{ width: `${w}%` }} />
    </div>
  )
}

// ---- Budget modal ----
function BudgetModal({ userId, budget, categories, onClose, onSaved }: {
  userId: string; budget?: Budget | null; categories: Category[]; onClose: () => void; onSaved: () => void
}) {
  const { toast } = useToast()
  const expenseCats = categories.filter(c => c.type === 'expense' || c.type === 'both')
  const [catId, setCatId] = useState(budget?.categoryId ?? expenseCats[0]?.id ?? '')
  const [amount, setAmount] = useState(budget?.amount.toString() ?? '')
  const [err, setErr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) { setErr('Enter a valid amount'); return }
    if (!catId) { setErr('Select a category'); return }
    const b: Budget = { id: budget?.id ?? generateId(), categoryId: catId, amount: amt, period: 'monthly' }
    if (budget) { updateBudget(userId, b); toast.success('Budget updated') }
    else { addBudget(userId, b); toast.success('Budget created') }
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-modal-in">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-5">{budget ? 'Edit Budget' : 'New Budget'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Category</label>
            <select value={catId} onChange={e => setCatId(e.target.value)} className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border-none">
              {expenseCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Monthly limit</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant font-headline-md">$</span>
              <input type="number" min="1" step="1" placeholder="0" value={amount} onChange={e => { setAmount(e.target.value); setErr('') }}
                className="w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 font-headline-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
          </div>
          {err && <p className="text-error font-label-xs text-label-xs">{err}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">Cancel</button>
            <button type="submit" className="flex-1 teal-gradient text-white py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform">{budget ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Goal modal ----
function GoalModal({ userId, goal, onClose, onSaved }: {
  userId: string; goal?: Goal | null; onClose: () => void; onSaved: () => void
}) {
  const { toast } = useToast()
  const ICONS = ['savings', 'home', 'flight', 'directions_car', 'school', 'favorite', 'laptop', 'diamond', 'beach_access', 'business_center']
  const COLORS = ['#006a61', '#0F172A', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316', '#84CC16']

  const [name, setName] = useState(goal?.name ?? '')
  const [target, setTarget] = useState(goal?.targetAmount.toString() ?? '')
  const [current, setCurrent] = useState(goal?.currentAmount.toString() ?? '0')
  const [date, setDate] = useState(goal?.targetDate ?? '')
  const [icon, setIcon] = useState(goal?.icon ?? 'savings')
  const [color, setColor] = useState(goal?.color ?? '#006a61')
  const [err, setErr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('Name is required'); return }
    const tgt = parseFloat(target); const cur = parseFloat(current)
    if (!target || isNaN(tgt) || tgt <= 0) { setErr('Enter a valid target amount'); return }
    const g: Goal = {
      id: goal?.id ?? generateId(), name: name.trim(),
      targetAmount: tgt, currentAmount: isNaN(cur) ? 0 : cur,
      targetDate: date || '', icon, color, createdAt: goal?.createdAt ?? todayISO(),
    }
    if (goal) { updateGoal(userId, g); toast.success('Goal updated') }
    else { addGoal(userId, g); toast.success('Goal created') }
    onSaved(); onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-sm w-full animate-modal-in overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/30">
          <h3 className="font-headline-md text-headline-md text-on-surface">{goal ? 'Edit Goal' : 'New Savings Goal'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Goal name</label>
            <input type="text" placeholder="e.g. Emergency Fund" value={name} onChange={e => { setName(e.target.value); setErr('') }}
              className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Target ($)</label>
              <input type="number" min="1" placeholder="0" value={target} onChange={e => { setTarget(e.target.value); setErr('') }}
                className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Saved so far ($)</label>
              <input type="number" min="0" placeholder="0" value={current} onChange={e => setCurrent(e.target.value)}
                className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
            </div>
          </div>
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Target date (optional)</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30" />
          </div>
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-2 block">Icon</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-90 ${icon === ic ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                  <span className="material-symbols-outlined text-[20px]">{ic}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-2 block">Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all active:scale-90 ${color === c ? 'ring-2 ring-offset-2 ring-on-surface' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {err && <p className="text-error font-label-xs text-label-xs">{err}</p>}
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/30">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">Cancel</button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler} className="flex-1 teal-gradient text-white py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform">{goal ? 'Save' : 'Create'}</button>
        </div>
      </div>
    </div>
  )
}

// ---- Main page ----
export default function Budgets() {
  const session = getSession()!
  const { toast } = useToast()
  const [refresh, setRefresh] = useState(0)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [spendMap, setSpendMap] = useState<Record<string, number>>({})
  const [tab, setTab] = useState<'budgets' | 'goals'>('budgets')
  const [budgetModal, setBudgetModal] = useState<{ open: boolean; editing?: Budget | null }>({ open: false })
  const [goalModal, setGoalModal] = useState<{ open: boolean; editing?: Goal | null }>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'budget' | 'goal'; id: string } | null>(null)

  useEffect(() => {
    const uid = session.userId
    const now = new Date()
    setBudgets(getBudgets(uid))
    setGoals(getGoals(uid))
    setCategories(getCategories(uid))
    const txs = getTransactions(uid)
    const map: Record<string, number> = {}
    txs.filter(t => {
      const d = new Date(t.date + 'T00:00:00')
      return t.type === 'expense' && d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    }).forEach(t => { map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount })
    setSpendMap(map)
  }, [refresh])

  function getCat(id: string) { return categories.find(c => c.id === id) }

  function handleDelete() {
    if (!deleteTarget) return
    if (deleteTarget.type === 'budget') { deleteBudget(session.userId, deleteTarget.id); toast.success('Budget deleted') }
    else { deleteGoal(session.userId, deleteTarget.id); toast.success('Goal deleted') }
    setDeleteTarget(null); setRefresh(r => r + 1)
  }

  return (
    <PageTransition>
      <div className="p-container-padding max-w-5xl mx-auto space-y-section-margin">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Budgets & Goals</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Track your spending limits and savings targets</p>
          </div>
          <button
            onClick={() => tab === 'budgets' ? setBudgetModal({ open: true }) : setGoalModal({ open: true })}
            className="teal-gradient text-white px-5 py-3 rounded-xl font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {tab === 'budgets' ? 'New Budget' : 'New Goal'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-surface-container rounded-xl w-fit">
          {(['budgets', 'goals'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-2.5 rounded-lg font-label-sm text-label-sm capitalize transition-all active:scale-95 ${
                tab === t ? 'bg-surface-container-lowest shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
              }`}>{t}</button>
          ))}
        </div>

        {/* Budgets tab */}
        {tab === 'budgets' && (
          budgets.length === 0 ? (
            <EmptyState icon="track_changes" title="No budgets yet"
              description="Set monthly spending limits to keep your finances on track"
              action={{ label: 'Create Budget', onClick: () => setBudgetModal({ open: true }) }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {budgets.map(b => {
                const cat = getCat(b.categoryId)
                const spent = spendMap[b.categoryId] ?? 0
                const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0
                const over = pct >= 100; const warn = pct >= 80 && !over
                return (
                  <div key={b.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${cat?.color ?? '#ccc'}20` }}>
                          <span className="material-symbols-outlined text-[22px]" style={{ color: cat?.color ?? '#ccc' }}>{cat?.icon ?? 'help'}</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface font-medium">{cat?.name ?? 'Unknown'}</p>
                          <p className="font-label-xs text-label-xs text-on-surface-variant">Monthly · {formatCurrency(b.amount)} limit</p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setBudgetModal({ open: true, editing: b })} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-90">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteTarget({ type: 'budget', id: b.id })} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all active:scale-90">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                    <AnimatedBar pct={pct} className={over ? 'bg-gradient-to-r from-error to-red-400' : warn ? 'bg-gradient-to-r from-[#F59E0B] to-[#FBBF24]' : 'teal-gradient'} />
                    <div className="flex justify-between items-center mt-3">
                      <span className="font-label-sm text-label-sm text-on-surface">{formatCurrency(spent)} <span className="text-on-surface-variant font-normal">spent</span></span>
                      <span className={`font-label-xs text-label-xs font-semibold px-2 py-0.5 rounded-full ${over ? 'bg-error-container text-on-error-container' : warn ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-secondary/10 text-secondary'}`}>
                        {pct}% {over ? '🔴 Over' : warn ? '⚠️ Near limit' : 'used'}
                      </span>
                    </div>
                    {over && (
                      <p className="mt-2 font-label-xs text-label-xs text-error">
                        Over budget by {formatCurrency(spent - b.amount)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}

        {/* Goals tab */}
        {tab === 'goals' && (
          goals.length === 0 ? (
            <EmptyState icon="savings" title="No savings goals yet"
              description="Set financial goals and track your progress toward them"
              action={{ label: 'Create Goal', onClick: () => setGoalModal({ open: true }) }} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {goals.map(g => {
                const pct = g.targetAmount > 0 ? Math.min(Math.round((g.currentAmount / g.targetAmount) * 100), 100) : 0
                const remaining = g.targetAmount - g.currentAmount
                return (
                  <div key={g.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${g.color}20` }}>
                          <span className="material-symbols-outlined text-[24px]" style={{ color: g.color }}>{g.icon}</span>
                        </div>
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface font-medium">{g.name}</p>
                          {g.targetDate && (
                            <p className="font-label-xs text-label-xs text-on-surface-variant">Target: {formatDate(g.targetDate)}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setGoalModal({ open: true, editing: g })} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-90">
                          <span className="material-symbols-outlined text-[18px]">edit</span>
                        </button>
                        <button onClick={() => setDeleteTarget({ type: 'goal', id: g.id })} className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all active:scale-90">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-label-xs text-label-xs text-on-surface-variant">{pct}% complete</span>
                        {pct >= 100 && <span className="font-label-xs text-label-xs text-secondary">🎉 Completed!</span>}
                      </div>
                      <AnimatedBar pct={pct} className="teal-gradient" />
                    </div>

                    <div className="flex justify-between">
                      <div>
                        <p className="font-label-xs text-label-xs text-on-surface-variant">Saved</p>
                        <p className="font-headline-md text-headline-md text-secondary">{formatCurrency(g.currentAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-label-xs text-label-xs text-on-surface-variant">Remaining</p>
                        <p className="font-headline-md text-headline-md text-on-surface">{remaining > 0 ? formatCurrency(remaining) : '—'}</p>
                      </div>
                    </div>

                    {/* Quick add saved amount */}
                    <div className="mt-4 pt-4 border-t border-outline-variant/30 flex gap-2">
                      <input
                        type="number" min="0" placeholder="Add amount"
                        id={`goal-add-${g.id}`}
                        className="flex-1 bg-surface-container rounded-lg px-3 py-2 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 text-sm"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(`goal-add-${g.id}`) as HTMLInputElement
                          const amt = parseFloat(input.value)
                          if (!isNaN(amt) && amt > 0) {
                            updateGoal(session.userId, { ...g, currentAmount: g.currentAmount + amt })
                            input.value = ''
                            setRefresh(r => r + 1)
                            toast.success(`Added ${formatCurrency(amt)} to ${g.name}`)
                          }
                        }}
                        className="px-3 py-2 bg-secondary text-white rounded-lg font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all"
                      >Add</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      {budgetModal.open && (
        <BudgetModal userId={session.userId} budget={budgetModal.editing} categories={categories}
          onClose={() => setBudgetModal({ open: false })} onSaved={() => setRefresh(r => r + 1)} />
      )}
      {goalModal.open && (
        <GoalModal userId={session.userId} goal={goalModal.editing}
          onClose={() => setGoalModal({ open: false })} onSaved={() => setRefresh(r => r + 1)} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-modal-in">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Delete {deleteTarget.type === 'budget' ? 'Budget' : 'Goal'}?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">Cancel</button>
              <button onClick={handleDelete} className="flex-1 py-3 rounded-lg bg-error text-on-error font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
