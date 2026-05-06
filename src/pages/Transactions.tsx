import { useState, useEffect, useMemo } from 'react'
import { getSession } from '../auth/session'
import { getTransactions, deleteTransaction } from '../store/transactions'
import { getCategories } from '../store/categories'
import { formatCurrency, formatDate } from '../utils'
import { useToast } from '../hooks/useToast'
import { SkeletonRow } from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'
import TransactionModal from '../components/TransactionModal'
import PageTransition from '../components/PageTransition'
import type { Transaction, Category } from '../store/types'

const SORTS = ['date-desc', 'date-asc', 'amount-desc', 'amount-asc'] as const
type Sort = typeof SORTS[number]

export default function Transactions() {
  const session = getSession()!
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [refresh, setRefresh] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [catFilter, setCatFilter] = useState('')
  const [monthFilter, setMonthFilter] = useState(() => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`
  })
  const [sort, setSort] = useState<Sort>('date-desc')

  useEffect(() => {
    setLoading(true)
    const uid = session.userId
    setTransactions(getTransactions(uid))
    setCategories(getCategories(uid))
    setTimeout(() => setLoading(false), 300)
  }, [refresh])

  const filtered = useMemo(() => {
    let list = [...transactions]
    if (monthFilter) list = list.filter(t => t.date.startsWith(monthFilter))
    if (typeFilter !== 'all') list = list.filter(t => t.type === typeFilter)
    if (catFilter) list = list.filter(t => t.categoryId === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.description.toLowerCase().includes(q) || t.notes?.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      if (sort === 'date-desc') return b.date.localeCompare(a.date)
      if (sort === 'date-asc') return a.date.localeCompare(b.date)
      if (sort === 'amount-desc') return b.amount - a.amount
      if (sort === 'amount-asc') return a.amount - b.amount
      return 0
    })
    return list
  }, [transactions, monthFilter, typeFilter, catFilter, search, sort])

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const totalExpenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  function getCat(id: string): Category | undefined {
    return categories.find(c => c.id === id)
  }

  function handleDelete(id: string) {
    deleteTransaction(session.userId, id)
    setDeleting(null)
    setRefresh(r => r + 1)
    toast.success('Transaction deleted')
  }

  function openEdit(tx: Transaction) {
    setEditing(tx)
    setShowModal(true)
  }

  // Generate month options from existing transactions
  const monthOptions = useMemo(() => {
    const months = new Set<string>()
    transactions.forEach(t => months.add(t.date.slice(0, 7)))
    const now = new Date()
    const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    months.add(cur)
    return [...months].sort((a, b) => b.localeCompare(a))
  }, [transactions])

  return (
    <PageTransition>
      <div className="p-container-padding max-w-7xl mx-auto space-y-section-margin">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Transactions</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''} found</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowModal(true) }}
            className="teal-gradient text-white px-5 py-3 rounded-xl font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform flex items-center gap-2 self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Transaction
          </button>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20">
            <span className="material-symbols-outlined text-secondary text-[16px]">arrow_downward</span>
            <span className="font-label-sm text-label-sm text-secondary">Income: {formatCurrency(totalIncome)}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-error/10 border border-error/20">
            <span className="material-symbols-outlined text-error text-[16px]">arrow_upward</span>
            <span className="font-label-sm text-label-sm text-error">Expenses: {formatCurrency(totalExpenses)}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container border border-outline-variant/30">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Net: </span>
            <span className={`font-label-sm text-label-sm font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-secondary' : 'text-error'}`}>
              {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatCurrency(totalIncome - totalExpenses)}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
              <input
                type="text"
                placeholder="Search transactions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-surface-container rounded-lg pl-9 pr-4 py-2.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
              />
            </div>

            {/* Month */}
            <select
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
              className="bg-surface-container rounded-lg px-4 py-2.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border-none"
            >
              <option value="">All months</option>
              {monthOptions.map(m => {
                const [yr, mo] = m.split('-')
                const label = new Date(Number(yr), Number(mo) - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
                return <option key={m} value={m}>{label}</option>
              })}
            </select>

            {/* Type */}
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as typeof typeFilter)}
              className="bg-surface-container rounded-lg px-4 py-2.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border-none"
            >
              <option value="all">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expenses</option>
            </select>

            {/* Category */}
            <select
              value={catFilter}
              onChange={e => setCatFilter(e.target.value)}
              className="bg-surface-container rounded-lg px-4 py-2.5 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border-none"
            >
              <option value="">All categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-wider">Sort:</span>
            {([
              ['date-desc', 'Newest first'],
              ['date-asc', 'Oldest first'],
              ['amount-desc', 'Highest amount'],
              ['amount-asc', 'Lowest amount'],
            ] as [Sort, string][]).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setSort(val)}
                className={`px-3 py-1 rounded-full font-label-xs text-label-xs transition-all active:scale-95 ${
                  sort === val ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Transaction list */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-1">
              {[1,2,3,4,5].map(i => <SkeletonRow key={i} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="receipt_long"
              title="No transactions found"
              description={search || catFilter || typeFilter !== 'all' ? 'Try adjusting your filters' : 'Add your first transaction to get started'}
              action={!search && !catFilter && typeFilter === 'all' ? {
                label: 'Add Transaction',
                onClick: () => { setEditing(null); setShowModal(true) },
              } : undefined}
            />
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {filtered.map(tx => {
                const cat = getCat(tx.categoryId)
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-4 px-6 py-4 hover:bg-surface-container-low transition-colors group"
                  >
                    {/* Category icon */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${cat?.color ?? '#ccc'}20` }}
                    >
                      <span className="material-symbols-outlined text-[22px]" style={{ color: cat?.color ?? '#ccc' }}>
                        {cat?.icon ?? 'payments'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-label-sm text-label-sm text-on-surface font-medium truncate">{tx.description}</p>
                        {tx.isRecurringTemplate && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-label-xs text-[10px] leading-4">
                            recurring
                          </span>
                        )}
                        {tx.recurringSourceId && (
                          <span className="shrink-0 px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-label-xs text-[10px] leading-4">
                            auto
                          </span>
                        )}
                      </div>
                      <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                        {cat?.name ?? 'Unknown'} · {formatDate(tx.date)}
                        {tx.notes && <span className="ml-2 italic">"{tx.notes}"</span>}
                      </p>
                    </div>

                    {/* Amount */}
                    <div className="text-right shrink-0">
                      <p className={`font-label-sm text-label-sm font-semibold ${tx.type === 'income' ? 'text-secondary' : 'text-on-surface'}`}>
                        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={() => openEdit(tx)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button
                        onClick={() => setDeleting(tx.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Delete confirm */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleting(null)} />
          <div className="relative bg-surface rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-modal-in">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Delete Transaction?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleting(null)} className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 py-3 rounded-lg bg-error text-on-error font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <TransactionModal
          userId={session.userId}
          transaction={editing}
          onClose={() => { setShowModal(false); setEditing(null) }}
          onSaved={() => setRefresh(r => r + 1)}
        />
      )}
    </PageTransition>
  )
}
