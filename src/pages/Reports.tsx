import { useState, useEffect } from 'react'
import { getSession } from '../auth/session'
import { getTransactions } from '../store/transactions'
import { getCategories } from '../store/categories'
import { formatCurrency } from '../utils'
import PageTransition from '../components/PageTransition'
import EmptyState from '../components/EmptyState'
import type { Transaction, Category } from '../store/types'

// ---- SVG Bar Chart ----
function BarChart({ data }: { data: { label: string; income: number; expense: number }[] }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const id = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(id) }, [])

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1)
  const W = 600; const H = 220; const barW = 18; const gap = 8
  const groupW = barW * 2 + gap + 20
  const padL = 60; const padB = 36; const chartH = H - padB - 16

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'Work Sans, sans-serif' }}>
      {/* Y grid */}
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = 16 + chartH * (1 - f)
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - 16} y2={y} stroke="#c6c6cd" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#76777d">
              {f === 0 ? '' : `$${((maxVal * f) / 1000).toFixed(0)}k`}
            </text>
          </g>
        )
      })}

      {data.map((d, i) => {
        const x = padL + i * groupW
        const iH = animated ? (d.income / maxVal) * chartH : 0
        const eH = animated ? (d.expense / maxVal) * chartH : 0
        return (
          <g key={d.label}>
            {/* Income bar */}
            <rect x={x} y={16 + chartH - iH} width={barW} height={iH} fill="#006a61" rx="3"
              style={{ transition: 'height 1s cubic-bezier(0.4,0,0.2,1), y 1s cubic-bezier(0.4,0,0.2,1)' }} />
            {/* Expense bar */}
            <rect x={x + barW + gap} y={16 + chartH - eH} width={barW} height={eH} fill="#131b2e" rx="3"
              style={{ transition: 'height 1s cubic-bezier(0.4,0,0.2,1), y 1s cubic-bezier(0.4,0,0.2,1)' }} />
            <text x={x + barW} y={H - 8} textAnchor="middle" fontSize="10" fill="#76777d">{d.label}</text>
          </g>
        )
      })}

      {/* Legend */}
      <rect x={padL} y={2} width={12} height={10} fill="#006a61" rx="2" />
      <text x={padL + 16} y={11} fontSize="11" fill="#45464d">Income</text>
      <rect x={padL + 80} y={2} width={12} height={10} fill="#131b2e" rx="2" />
      <text x={padL + 96} y={11} fontSize="11" fill="#45464d">Expenses</text>
    </svg>
  )
}

// ---- SVG Donut Chart ----
function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setAnimated(true), 200)
    return () => clearTimeout(id)
  }, [slices])

  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) return null

  const R = 70; const cx = 90; const cy = 90; const stroke = 32
  let cumAngle = -90

  const paths = slices.map(sl => {
    const frac = sl.value / total
    const startAngle = cumAngle
    cumAngle += frac * 360
    const endAngle = cumAngle
    const r = R
    const toRad = (deg: number) => (deg * Math.PI) / 180
    const x1 = cx + r * Math.cos(toRad(startAngle))
    const y1 = cy + r * Math.sin(toRad(startAngle))
    const x2 = cx + r * Math.cos(toRad(endAngle))
    const y2 = cy + r * Math.sin(toRad(endAngle))
    const largeArc = frac > 0.5 ? 1 : 0
    const circumference = 2 * Math.PI * r
    const dashLen = animated ? circumference * frac : 0
    return { ...sl, frac, x1, y1, x2, y2, largeArc, circumference, dashLen, startAngle, endAngle }
  })

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0">
        {paths.map((p, i) => (
          <path key={i}
            d={`M ${cx} ${cy} L ${p.x1} ${p.y1} A ${R} ${R} 0 ${p.largeArc} 1 ${p.x2} ${p.y2} Z`}
            fill={p.color}
            opacity={animated ? 1 : 0}
            style={{ transition: `opacity 0.6s ease ${i * 0.1}s` }}
          />
        ))}
        <circle cx={cx} cy={cy} r={R - stroke} fill="white" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1b1b1d">
          {slices.length}
        </text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="10" fill="#76777d">categories</text>
      </svg>
      <div className="flex flex-col gap-2 flex-1 min-w-0">
        {slices.map((sl, i) => (
          <div key={i} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: sl.color }} />
              <span className="font-label-sm text-label-sm text-on-surface truncate">{sl.label}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="font-label-xs text-label-xs text-on-surface-variant">
                {total > 0 ? Math.round((sl.value / total) * 100) : 0}%
              </span>
              <span className="font-label-sm text-label-sm text-on-surface font-semibold w-24 text-right">{formatCurrency(sl.value)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Line Chart ----
function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const [animated, setAnimated] = useState(false)
  useEffect(() => { const id = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(id) }, [])

  if (data.length < 2) return null
  const W = 600; const H = 160; const padL = 56; const padB = 32; const padR = 16
  const chartW = W - padL - padR; const chartH = H - padB - 16
  const maxVal = Math.max(...data.map(d => d.value), 1)
  const minVal = Math.min(...data.map(d => Math.min(d.value, 0)))
  const range = maxVal - minVal || 1

  const pts = data.map((d, i) => ({
    x: padL + (i / (data.length - 1)) * chartW,
    y: 16 + chartH - ((d.value - minVal) / range) * chartH,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaD = `${pathD} L ${pts[pts.length - 1].x} ${H - padB} L ${pts[0].x} ${H - padB} Z`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ fontFamily: 'Work Sans, sans-serif' }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#006a61" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#006a61" stopOpacity="0.01" />
        </linearGradient>
        <clipPath id="lineClip">
          <rect x={padL} y={0} width={animated ? chartW : 0} height={H}
            style={{ transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)' }} />
        </clipPath>
      </defs>
      {[0, 0.5, 1].map(f => {
        const y = 16 + chartH * (1 - f)
        const val = minVal + range * f
        return (
          <g key={f}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="#c6c6cd" strokeWidth="0.5" strokeDasharray="4 4" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#76777d">
              {val >= 0 ? `$${(val / 1000).toFixed(0)}k` : `-$${(Math.abs(val) / 1000).toFixed(0)}k`}
            </text>
          </g>
        )
      })}
      <g clipPath="url(#lineClip)">
        <path d={areaD} fill="url(#lineGrad)" />
        <path d={pathD} fill="none" stroke="#006a61" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#006a61" strokeWidth="2" />
        ))}
      </g>
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={H - 8} textAnchor="middle" fontSize="10" fill="#76777d">{d.label}</text>
      ))}
    </svg>
  )
}

// ---- Main page ----
type Range = 'this-month' | 'last-month' | 'last-3' | 'this-year' | 'all'

export default function Reports() {
  const session = getSession()!
  const [range, setRange] = useState<Range>('this-month')
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    setTransactions(getTransactions(session.userId))
    setCategories(getCategories(session.userId))
  }, [])

  function getDateRange(): { start: Date; end: Date } {
    const now = new Date()
    if (range === 'this-month') return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
    if (range === 'last-month') {
      const s = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const e = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: s, end: e }
    }
    if (range === 'last-3') return { start: new Date(now.getFullYear(), now.getMonth() - 2, 1), end: now }
    if (range === 'this-year') return { start: new Date(now.getFullYear(), 0, 1), end: now }
    return { start: new Date(2000, 0, 1), end: now }
  }

  const { start, end } = getDateRange()
  const filtered = transactions.filter(t => {
    const d = new Date(t.date + 'T00:00:00')
    return d >= start && d <= end
  })

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net = income - expenses
  const txCount = filtered.length

  // Monthly bar chart data (last 6 months)
  const barData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const yr = d.getFullYear(); const mo = d.getMonth()
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date + 'T00:00:00')
      return td.getFullYear() === yr && td.getMonth() === mo
    })
    return {
      label: d.toLocaleString('default', { month: 'short' }),
      income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    }
  })

  // Category spending donut
  const catMap = new Map<string, number>()
  filtered.filter(t => t.type === 'expense').forEach(t => {
    catMap.set(t.categoryId, (catMap.get(t.categoryId) ?? 0) + t.amount)
  })
  const catSlices = [...catMap.entries()]
    .map(([id, value]) => {
      const cat = categories.find(c => c.id === id)
      return { label: cat?.name ?? 'Other', value, color: cat?.color ?? '#9CA3AF' }
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 8)

  // Net worth line chart (cumulative by month, last 6 months)
  let cumulative = 0
  const lineData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i))
    const yr = d.getFullYear(); const mo = d.getMonth()
    const monthTx = transactions.filter(t => {
      const td = new Date(t.date + 'T00:00:00')
      return td.getFullYear() === yr && td.getMonth() === mo
    })
    const monthNet = monthTx.reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0)
    cumulative += monthNet
    return { label: d.toLocaleString('default', { month: 'short' }), value: cumulative }
  })

  const RANGES: [Range, string][] = [
    ['this-month', 'This Month'],
    ['last-month', 'Last Month'],
    ['last-3', 'Last 3 Months'],
    ['this-year', 'This Year'],
    ['all', 'All Time'],
  ]

  return (
    <PageTransition>
      <div className="p-container-padding max-w-6xl mx-auto space-y-section-margin">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Financial Reports</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Insights into your financial health</p>
          </div>
          {/* Range selector */}
          <div className="flex gap-1 p-1 bg-surface-container rounded-xl overflow-x-auto">
            {RANGES.map(([val, label]) => (
              <button key={val} onClick={() => setRange(val)}
                className={`px-3 py-2 rounded-lg font-label-xs text-label-xs whitespace-nowrap transition-all active:scale-95 ${
                  range === val ? 'bg-surface-container-lowest shadow-sm text-on-surface font-semibold' : 'text-on-surface-variant hover:text-on-surface'
                }`}>{label}</button>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <EmptyState icon="insights" title="No data yet"
            description="Add transactions to start seeing financial reports and insights" />
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-gutter">
              {[
                { label: 'Total Income', value: formatCurrency(income), color: 'text-secondary', icon: 'arrow_downward' },
                { label: 'Total Expenses', value: formatCurrency(expenses), color: 'text-error', icon: 'arrow_upward' },
                { label: 'Net Income', value: `${net >= 0 ? '+' : ''}${formatCurrency(net)}`, color: net >= 0 ? 'text-secondary' : 'text-error', icon: 'account_balance' },
                { label: 'Transactions', value: txCount.toString(), color: 'text-on-surface', icon: 'receipt_long' },
              ].map(k => (
                <div key={k.label} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`material-symbols-outlined text-[16px] ${k.color}`}>{k.icon}</span>
                    <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest">{k.label}</p>
                  </div>
                  <p className={`font-headline-lg text-headline-lg font-bold ${k.color}`}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Monthly bar chart */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
              <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Monthly Overview</h3>
              <p className="font-label-xs text-label-xs text-on-surface-variant mb-6">Income vs expenses over the last 6 months</p>
              <BarChart data={barData} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
              {/* Category breakdown */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Spending by Category</h3>
                <p className="font-label-xs text-label-xs text-on-surface-variant mb-6">Where your money is going</p>
                {catSlices.length > 0 ? (
                  <DonutChart slices={catSlices} />
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant text-center py-8">No expense data in this period</p>
                )}
              </div>

              {/* Net worth trend */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Net Worth Trend</h3>
                <p className="font-label-xs text-label-xs text-on-surface-variant mb-6">Cumulative net over 6 months</p>
                <LineChart data={lineData} />
              </div>
            </div>

            {/* Top spending categories table */}
            {catSlices.length > 0 && (
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Top Spending Categories</h3>
                <div className="space-y-3">
                  {catSlices.map((sl, i) => {
                    const pct = expenses > 0 ? (sl.value / expenses) * 100 : 0
                    return (
                      <div key={sl.label} className="flex items-center gap-4">
                        <span className="font-label-xs text-label-xs text-on-surface-variant w-4 text-right">{i + 1}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sl.color }} />
                              <span className="font-label-sm text-label-sm text-on-surface">{sl.label}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-label-xs text-label-xs text-on-surface-variant">{pct.toFixed(1)}%</span>
                              <span className="font-label-sm text-label-sm text-on-surface font-semibold w-24 text-right">{formatCurrency(sl.value)}</span>
                            </div>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, backgroundColor: sl.color }} />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </PageTransition>
  )
}
