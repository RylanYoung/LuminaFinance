import { getSession } from '../auth/session'
import { getNetWorthHistory, getTotalByType, ASSET_META, ASSET_ORDER } from '../store/assets'
import { getIncome } from '../store/income'
import { getBudgetCategories, getTotalMonthlyExpenses } from '../store/budget'
import { getSettings } from '../store/settings'
import PageTransition from '../components/PageTransition'

// ---- SVG Line Chart ----
function LineChart({
  data,
  sym,
  color = '#006a61',
}: {
  data: { date: string; value: number }[]
  sym: string
  color?: string
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-on-surface-variant font-label-sm text-label-sm">
        Not enough history yet — update asset values over multiple days to see growth
      </div>
    )
  }

  const W = 600
  const H = 180
  const PAD = { top: 16, right: 16, bottom: 32, left: 60 }
  const chartW = W - PAD.left - PAD.right
  const chartH = H - PAD.top - PAD.bottom

  const values = data.map(d => d.value)
  const minV = Math.min(...values)
  const maxV = Math.max(...values)
  const rangeV = maxV - minV || 1

  function xOf(i: number) {
    return PAD.left + (i / (data.length - 1)) * chartW
  }
  function yOf(v: number) {
    return PAD.top + chartH - ((v - minV) / rangeV) * chartH
  }

  const pathD = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${xOf(i).toFixed(1)},${yOf(d.value).toFixed(1)}`)
    .join(' ')

  const areaD =
    pathD +
    ` L${xOf(data.length - 1).toFixed(1)},${(PAD.top + chartH).toFixed(1)}` +
    ` L${PAD.left.toFixed(1)},${(PAD.top + chartH).toFixed(1)} Z`

  function fmtK(v: number) {
    if (Math.abs(v) >= 1_000_000) return `${sym}${(v / 1_000_000).toFixed(1)}M`
    if (Math.abs(v) >= 1_000) return `${sym}${(v / 1_000).toFixed(0)}K`
    return `${sym}${Math.round(v)}`
  }

  const yTicks = 4
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const v = minV + (rangeV / yTicks) * i
    return { v, y: yOf(v) }
  })

  const xStep = Math.max(1, Math.floor(data.length / 5))
  const xLabels = data
    .filter((_, i) => i % xStep === 0 || i === data.length - 1)
    .map(d => ({
      label: d.date.slice(5),
      x: xOf(data.indexOf(d)),
    }))

  const uid = `lg-${Math.random().toString(36).slice(2, 7)}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {yLabels.map(({ y }, i) => (
        <line key={i} x1={PAD.left} y1={y} x2={W - PAD.right} y2={y}
          stroke="#e4e2e4" strokeWidth="1" strokeDasharray="4 3" />
      ))}

      {/* Area fill */}
      <path d={areaD} fill={`url(#${uid})`} />

      {/* Line */}
      <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Y axis labels */}
      {yLabels.map(({ v, y }, i) => (
        <text key={i} x={PAD.left - 6} y={y + 4} textAnchor="end"
          className="fill-on-surface-variant" style={{ fontSize: 10, fontFamily: 'Work Sans, sans-serif' }}>
          {fmtK(v)}
        </text>
      ))}

      {/* X axis labels */}
      {xLabels.map(({ label, x }, i) => (
        <text key={i} x={x} y={H - 4} textAnchor="middle"
          className="fill-on-surface-variant" style={{ fontSize: 10, fontFamily: 'Work Sans, sans-serif' }}>
          {label}
        </text>
      ))}

      {/* Last point dot */}
      <circle
        cx={xOf(data.length - 1)}
        cy={yOf(data[data.length - 1].value)}
        r="4" fill={color} stroke="white" strokeWidth="2"
      />
    </svg>
  )
}

// ---- SVG Donut Chart ----
function DonutChart({
  slices,
  sym,
}: {
  slices: { label: string; value: number; color: string }[]
  sym: string
}) {
  const total = slices.reduce((s, sl) => s + sl.value, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-on-surface-variant font-label-sm text-label-sm">
        No asset data yet
      </div>
    )
  }

  const R = 70
  const CX = 90
  const CY = 90
  const strokeWidth = 28

  let cumAngle = -90
  const arcs = slices
    .filter(sl => sl.value > 0)
    .map(sl => {
      const angle = (sl.value / total) * 360
      const start = cumAngle
      cumAngle += angle
      return { ...sl, startAngle: start, sweepAngle: angle }
    })

  function polarToXY(angle: number, r: number) {
    const rad = (angle * Math.PI) / 180
    return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) }
  }

  function arcPath(startAngle: number, sweepAngle: number) {
    const clamp = Math.min(sweepAngle, 359.99)
    const start = polarToXY(startAngle, R)
    const end = polarToXY(startAngle + clamp, R)
    const large = clamp > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${R} ${R} 0 ${large} 1 ${end.x} ${end.y}`
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 180 180" className="w-44 h-44 shrink-0">
        {arcs.map((arc, i) => (
          <path
            key={i}
            d={arcPath(arc.startAngle, arc.sweepAngle)}
            fill="none"
            stroke={arc.color}
            strokeWidth={strokeWidth}
            strokeLinecap="butt"
          />
        ))}
        <text x={CX} y={CY - 8} textAnchor="middle" className="fill-on-surface-variant" style={{ fontSize: 10 }}>
          Total
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" className="fill-on-surface" style={{ fontSize: 13, fontWeight: 700 }}>
          {sym}{total >= 1_000_000 ? `${(total / 1_000_000).toFixed(1)}M` : total >= 1000 ? `${(total / 1000).toFixed(0)}K` : total.toLocaleString()}
        </text>
      </svg>

      <div className="flex-1 grid grid-cols-1 gap-2 w-full">
        {arcs.map((arc, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: arc.color }} />
            <span className="font-label-xs text-label-xs text-on-surface-variant flex-1">{arc.label}</span>
            <span className="font-label-xs text-label-xs text-on-surface tabular-nums">
              {sym}{arc.value >= 1000 ? `${(arc.value / 1000).toFixed(1)}K` : arc.value.toLocaleString()}
            </span>
            <span className="font-label-xs text-label-xs text-on-surface-variant tabular-nums w-10 text-right">
              {((arc.value / total) * 100).toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---- Budget bar chart ----
function BudgetBars({
  categories,
  sym,
}: {
  categories: { name: string; color: string; icon: string; monthlyBudget: number; monthlySpent: number }[]
  sym: string
}) {
  const active = categories.filter(c => c.monthlyBudget > 0 || c.monthlySpent > 0)
  if (active.length === 0) {
    return (
      <div className="text-center py-8 text-on-surface-variant font-label-sm text-label-sm">
        No budget data yet
      </div>
    )
  }

  const maxVal = Math.max(...active.map(c => Math.max(c.monthlyBudget, c.monthlySpent)), 1)

  return (
    <div className="space-y-4">
      {active.map(cat => {
        const spentPct = (cat.monthlySpent / maxVal) * 100
        const budgetPct = (cat.monthlyBudget / maxVal) * 100
        const over = cat.monthlyBudget > 0 && cat.monthlySpent > cat.monthlyBudget
        return (
          <div key={cat.name}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]" style={{ color: cat.color }}>
                  {cat.icon}
                </span>
                <span className="font-label-xs text-label-xs text-on-surface">{cat.name}</span>
              </div>
              <span className={`font-label-xs text-label-xs tabular-nums ${over ? 'text-error' : 'text-on-surface-variant'}`}>
                {sym}{cat.monthlySpent.toLocaleString()}
                {cat.monthlyBudget > 0 && ` / ${sym}${cat.monthlyBudget.toLocaleString()}`}
              </span>
            </div>
            <div className="relative h-4 bg-surface-container-high rounded-full overflow-hidden">
              {cat.monthlyBudget > 0 && (
                <div
                  className="absolute top-0 left-0 h-full rounded-full opacity-30 transition-all duration-700"
                  style={{ width: `${budgetPct}%`, backgroundColor: cat.color }}
                />
              )}
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-700"
                style={{ width: `${spentPct}%`, backgroundColor: over ? '#ba1a1a' : cat.color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Reports() {
  const session = getSession()!
  const settings = getSettings(session.userId)
  const sym = settings.currencySymbol

  const history = getNetWorthHistory(session.userId)
  const byType = getTotalByType(session.userId)
  const income = getIncome(session.userId)
  const categories = getBudgetCategories(session.userId)
  const totalSpent = getTotalMonthlyExpenses(session.userId)

  const donutSlices = ASSET_ORDER
    .map(type => ({
      label: ASSET_META[type].label,
      value: byType[type],
      color: ASSET_META[type].color,
    }))
    .filter(s => s.value > 0)

  const netWorthChange = history.length >= 2
    ? history[history.length - 1].value - history[0].value
    : 0

  const currentNetWorth = history.length > 0 ? history[history.length - 1].value : 0

  return (
    <PageTransition>
      <div className="p-container-padding max-w-5xl mx-auto pb-12 space-y-section-margin">
        {/* Header */}
        <div className="pt-2">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Reports</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Track your financial growth over time
          </p>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-gutter">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Net Worth</p>
            <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
              {sym}{currentNetWorth.toLocaleString()}
            </p>
          </div>
          <div className={`border rounded-xl p-4 shadow-ambient ${
            netWorthChange >= 0 ? 'bg-secondary/10 border-secondary/30' : 'bg-error-container border-error/30'
          }`}>
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">
              Growth {history.length >= 2 ? `(${history.length} updates)` : ''}
            </p>
            <p className={`font-headline-md text-headline-md font-bold tabular-nums ${
              netWorthChange >= 0 ? 'text-secondary' : 'text-error'
            }`}>
              {netWorthChange >= 0 ? '+' : ''}{sym}{netWorthChange.toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Monthly Income</p>
            <p className="font-headline-md text-headline-md text-secondary font-bold tabular-nums">
              {sym}{income.monthlyAmount.toLocaleString()}
            </p>
          </div>
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-ambient">
            <p className="font-label-xs text-label-xs text-on-surface-variant uppercase tracking-widest mb-1">Monthly Expenses</p>
            <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
              {sym}{totalSpent.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Net worth growth chart */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Net Worth Over Time</h3>
          <LineChart data={history} sym={sym} color="#006a61" />
        </div>

        {/* Asset allocation donut */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Asset Allocation</h3>
          <DonutChart slices={donutSlices} sym={sym} />
        </div>

        {/* Budget breakdown */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-headline-md text-headline-md text-on-surface">Monthly Budget Breakdown</h3>
              <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                Spent vs budgeted per category
              </p>
            </div>
            {income.monthlyAmount > 0 && (
              <div className="text-right">
                <p className="font-label-xs text-label-xs text-on-surface-variant">Savings rate</p>
                <p className={`font-headline-md text-headline-md font-bold ${
                  income.monthlyAmount > totalSpent ? 'text-secondary' : 'text-error'
                }`}>
                  {income.monthlyAmount > 0
                    ? Math.max(0, Math.round(((income.monthlyAmount - totalSpent) / income.monthlyAmount) * 100))
                    : 0}%
                </p>
              </div>
            )}
          </div>
          <BudgetBars categories={categories} sym={sym} />
        </div>

        {/* Income vs Expenses card */}
        {income.monthlyAmount > 0 && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-ambient">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Income vs Expenses</h3>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-xs text-label-xs text-on-surface-variant">Income</span>
                  <span className="font-label-xs text-label-xs text-secondary tabular-nums">
                    {sym}{income.monthlyAmount.toLocaleString()}
                  </span>
                </div>
                <div className="h-6 bg-secondary/20 rounded-lg overflow-hidden">
                  <div className="h-full teal-gradient rounded-lg" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-label-xs text-label-xs text-on-surface-variant">Expenses</span>
                  <span className={`font-label-xs text-label-xs tabular-nums ${
                    totalSpent > income.monthlyAmount ? 'text-error' : 'text-on-surface'
                  }`}>
                    {sym}{totalSpent.toLocaleString()}
                  </span>
                </div>
                <div className="h-6 bg-surface-container-high rounded-lg overflow-hidden">
                  <div
                    className={`h-full rounded-lg transition-all duration-700 ${
                      totalSpent > income.monthlyAmount ? 'bg-error' : 'bg-on-surface/20'
                    }`}
                    style={{
                      width: `${Math.min((totalSpent / income.monthlyAmount) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-outline-variant/20 flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface font-medium">
                  {income.monthlyAmount >= totalSpent ? 'Monthly Surplus' : 'Monthly Deficit'}
                </span>
                <span className={`font-headline-md text-headline-md font-bold tabular-nums ${
                  income.monthlyAmount >= totalSpent ? 'text-secondary' : 'text-error'
                }`}>
                  {income.monthlyAmount < totalSpent ? '-' : ''}{sym}
                  {Math.abs(income.monthlyAmount - totalSpent).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
