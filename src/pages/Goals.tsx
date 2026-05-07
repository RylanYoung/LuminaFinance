import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getSession } from '../auth/session'
import { getAssets, ASSET_META, ASSET_ORDER } from '../store/assets'
import { getNetWorthGoal } from '../store/networthGoal'
import { getSettings } from '../store/settings'
import PageTransition from '../components/PageTransition'

export default function Goals() {
  const session = getSession()!
  const navigate = useNavigate()
  const settings = getSettings(session.userId)
  const sym = settings.currencySymbol

  const [assets] = useState(() => getAssets(session.userId))
  const [nwGoal] = useState(() => getNetWorthGoal(session.userId))

  const totalNetWorth = assets.reduce((s, a) => s + a.currentValue, 0)
  const nwPct = nwGoal && nwGoal.targetAmount > 0
    ? Math.min((totalNetWorth / nwGoal.targetAmount) * 100, 100)
    : null

  const assetsWithGoal = assets.filter(a => a.goalValue && a.goalValue > 0)
  const assetsWithoutGoal = assets.filter(a => !a.goalValue || a.goalValue === 0)

  const totalGoal = assetsWithGoal.reduce((s, a) => s + (a.goalValue ?? 0), 0)
  const totalCurrent = assetsWithGoal.reduce((s, a) => s + a.currentValue, 0)
  const overallPct = totalGoal > 0 ? Math.min((totalCurrent / totalGoal) * 100, 100) : null

  return (
    <PageTransition>
      <div className="p-container-padding max-w-4xl mx-auto pb-12 space-y-section-margin">
        {/* Header */}
        <div className="pt-2">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Goals</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Track your progress across every asset and net worth target
          </p>
        </div>

        {/* Net worth goal */}
        <div className="teal-gradient rounded-2xl p-6 text-white shadow-ambient">
          <p className="text-white/70 font-label-xs text-label-xs uppercase tracking-widest mb-1">Net Worth Goal</p>
          {nwGoal && nwGoal.targetAmount > 0 ? (
            <>
              <div className="flex items-end justify-between mb-3">
                <div>
                  <p className="font-display-xl text-display-xl tabular-nums">
                    {sym}{totalNetWorth.toLocaleString()}
                  </p>
                  <p className="text-white/70 font-label-xs text-label-xs mt-1">
                    of {sym}{nwGoal.targetAmount.toLocaleString()} goal
                    {nwGoal.targetDate ? ` · by ${nwGoal.targetDate}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-headline-lg text-headline-lg font-bold">
                    {nwPct!.toFixed(1)}%
                  </p>
                  <p className="text-white/70 font-label-xs text-label-xs">there</p>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${nwPct}%` }}
                />
              </div>
              <p className="text-white/60 font-label-xs text-label-xs mt-2">
                {sym}{(nwGoal.targetAmount - totalNetWorth).toLocaleString()} remaining
              </p>
            </>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-white/70 font-body-md text-body-md">No net worth goal set yet</p>
              <button
                onClick={() => navigate('/settings')}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-label-sm text-label-sm transition-all active:scale-95"
              >
                Set Goal
              </button>
            </div>
          )}
        </div>

        {/* Overall asset goals summary */}
        {assetsWithGoal.length > 0 && overallPct !== null && (
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-headline-md text-headline-md text-on-surface">Overall Asset Goals</h3>
              <span className="font-headline-md text-headline-md text-secondary font-bold">
                {overallPct.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-surface-container-high rounded-full h-2.5 mb-2">
              <div
                className="h-2.5 rounded-full teal-gradient transition-all duration-1000"
                style={{ width: `${overallPct}%` }}
              />
            </div>
            <div className="flex justify-between">
              <span className="font-label-xs text-label-xs text-on-surface-variant tabular-nums">
                {sym}{totalCurrent.toLocaleString()} invested
              </span>
              <span className="font-label-xs text-label-xs text-on-surface-variant tabular-nums">
                {sym}{totalGoal.toLocaleString()} goal
              </span>
            </div>
          </div>
        )}

        {/* Goals by asset type */}
        {ASSET_ORDER.map(type => {
          const typeAssets = assetsWithGoal.filter(a => a.type === type)
          if (typeAssets.length === 0) return null
          const meta = ASSET_META[type]

          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: meta.color + '20' }}
                >
                  <span className="material-symbols-outlined text-[15px]" style={{ color: meta.color }}>
                    {meta.icon}
                  </span>
                </div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{meta.label}</h3>
              </div>

              <div className="space-y-3">
                {typeAssets.map(asset => {
                  const pct = Math.min((asset.currentValue / asset.goalValue!) * 100, 100)
                  const remaining = asset.goalValue! - asset.currentValue
                  const over = asset.currentValue >= asset.goalValue!

                  return (
                    <div
                      key={asset.id}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface font-semibold">
                            {asset.name}
                          </p>
                          {asset.notes && (
                            <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                              {asset.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p
                            className="font-headline-md text-headline-md font-bold tabular-nums"
                            style={{ color: over ? '#006a61' : undefined }}
                          >
                            {pct.toFixed(1)}%
                          </p>
                          {over && (
                            <span className="font-label-xs text-label-xs text-secondary">Goal reached!</span>
                          )}
                        </div>
                      </div>

                      <div className="w-full bg-surface-container-high rounded-full h-3 mb-3">
                        <div
                          className="h-3 rounded-full transition-all duration-1000"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: over ? '#006a61' : meta.color,
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-surface-container rounded-lg p-2">
                          <p className="font-label-xs text-label-xs text-on-surface-variant mb-0.5">Current</p>
                          <p className="font-label-sm text-label-sm text-on-surface font-semibold tabular-nums">
                            {sym}{asset.currentValue.toLocaleString()}
                          </p>
                        </div>
                        <div className="bg-surface-container rounded-lg p-2">
                          <p className="font-label-xs text-label-xs text-on-surface-variant mb-0.5">Goal</p>
                          <p className="font-label-sm text-label-sm text-on-surface font-semibold tabular-nums">
                            {sym}{asset.goalValue!.toLocaleString()}
                          </p>
                        </div>
                        <div
                          className="rounded-lg p-2"
                          style={{ backgroundColor: over ? '#006a6115' : meta.color + '15' }}
                        >
                          <p className="font-label-xs text-label-xs text-on-surface-variant mb-0.5">
                            {over ? 'Surplus' : 'Remaining'}
                          </p>
                          <p
                            className="font-label-sm text-label-sm font-semibold tabular-nums"
                            style={{ color: over ? '#006a61' : meta.color }}
                          >
                            {sym}{Math.abs(remaining).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Assets without goals */}
        {assetsWithoutGoal.length > 0 && (
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-3">No Goal Set</h3>
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient divide-y divide-outline-variant/20">
              {assetsWithoutGoal.map(asset => {
                const meta = ASSET_META[asset.type]
                return (
                  <div key={asset.id} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="material-symbols-outlined text-[18px]"
                        style={{ color: meta.color }}
                      >
                        {meta.icon}
                      </span>
                      <div>
                        <p className="font-label-sm text-label-sm text-on-surface">{asset.name}</p>
                        <p className="font-label-xs text-label-xs text-on-surface-variant">{meta.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-label-sm text-label-sm text-on-surface tabular-nums">
                        {sym}{asset.currentValue.toLocaleString()}
                      </p>
                      <button
                        onClick={() => navigate('/portfolio')}
                        className="font-label-xs text-label-xs text-secondary hover:underline"
                      >
                        Add goal →
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {assets.length === 0 && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-outline text-[48px] block mb-3">flag</span>
            <p className="font-body-md text-body-md text-on-surface mb-1">No assets added yet</p>
            <p className="font-label-xs text-label-xs text-on-surface-variant mb-4">
              Add assets in Portfolio to start tracking goals
            </p>
            <button
              onClick={() => navigate('/portfolio')}
              className="teal-gradient text-white px-5 py-2.5 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
            >
              Go to Portfolio
            </button>
          </div>
        )}
      </div>
    </PageTransition>
  )
}
