import { useState } from 'react'
import { getSession } from '../auth/session'
import {
  getAssets, addAsset, updateAsset, deleteAsset,
  ASSET_META, ASSET_ORDER,
} from '../store/assets'
import { getSettings } from '../store/settings'
import { useToast } from '../hooks/useToast'
import PageTransition from '../components/PageTransition'
import type { AssetAccount, AssetType } from '../store/types'

interface AssetModalProps {
  type: AssetType
  existing?: AssetAccount
  sym: string
  onSave: (data: Omit<AssetAccount, 'id' | 'history' | 'lastUpdated'> | AssetAccount) => void
  onClose: () => void
}

function AssetModal({ type, existing, sym, onSave, onClose }: AssetModalProps) {
  const meta = ASSET_META[type]
  const [name, setName] = useState(existing?.name ?? '')
  const [value, setValue] = useState(existing?.currentValue?.toString() ?? '')
  const [goal, setGoal] = useState(existing?.goalValue?.toString() ?? '')
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Name is required'
    if (!value || isNaN(Number(value)) || Number(value) < 0) e.value = 'Enter a valid amount'
    if (goal && (isNaN(Number(goal)) || Number(goal) < 0)) e.goal = 'Enter a valid goal'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSave() {
    if (!validate()) return
    if (existing) {
      onSave({
        ...existing,
        name: name.trim(),
        currentValue: Number(value),
        goalValue: goal ? Number(goal) : undefined,
        notes: notes.trim() || undefined,
      })
    } else {
      onSave({
        name: name.trim(),
        type,
        currentValue: Number(value),
        goalValue: goal ? Number(goal) : undefined,
        notes: notes.trim() || undefined,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-modal-in">
        <div className="flex items-center gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: meta.color + '20' }}
          >
            <span className="material-symbols-outlined text-[20px]" style={{ color: meta.color }}>
              {meta.icon}
            </span>
          </div>
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">
              {existing ? 'Edit' : 'Add'} {meta.label}
            </h3>
            <p className="font-label-xs text-label-xs text-on-surface-variant">{meta.description}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
              Account / Asset Name
            </label>
            <input
              type="text"
              placeholder={`e.g. My ${meta.label} Portfolio`}
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
            {errors.name && <p className="text-error font-label-xs text-label-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
              Current Value ({sym})
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                {sym}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            {errors.value && <p className="text-error font-label-xs text-label-xs mt-1">{errors.value}</p>}
          </div>

          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
              Goal Value ({sym}) — optional
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                {sym}
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={goal}
                onChange={e => setGoal(e.target.value)}
                className="w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
              />
            </div>
            {errors.goal && <p className="text-error font-label-xs text-label-xs mt-1">{errors.goal}</p>}
          </div>

          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
              Notes — optional
            </label>
            <input
              type="text"
              placeholder="e.g. Vanguard account"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg teal-gradient text-white font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
          >
            {existing ? 'Save Changes' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  )
}

interface UpdateValueModalProps {
  account: AssetAccount
  sym: string
  onSave: (newValue: number) => void
  onClose: () => void
}

function UpdateValueModal({ account, sym, onSave, onClose }: UpdateValueModalProps) {
  const meta = ASSET_META[account.type]
  const [value, setValue] = useState(account.currentValue.toString())
  const [error, setError] = useState('')

  function handleSave() {
    const n = Number(value)
    if (isNaN(n) || n < 0) { setError('Enter a valid amount'); return }
    onSave(n)
  }

  const diff = Number(value) - account.currentValue

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl p-6 shadow-2xl w-full max-w-sm animate-modal-in">
        <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Update Value</h3>
        <p className="font-label-xs text-label-xs text-on-surface-variant mb-5">
          {account.name} · {meta.label}
        </p>

        <div className="relative mb-2">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">{sym}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={value}
            onChange={e => setValue(e.target.value)}
            autoFocus
            className="w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
          />
        </div>

        {!isNaN(Number(value)) && Number(value) !== account.currentValue && (
          <p className={`font-label-xs text-label-xs mb-4 ${diff >= 0 ? 'text-secondary' : 'text-error'}`}>
            {diff >= 0 ? '+' : ''}{sym}{Math.abs(diff).toLocaleString()} from current value
          </p>
        )}
        {error && <p className="text-error font-label-xs text-label-xs mb-4">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 rounded-lg teal-gradient text-white font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Portfolio() {
  const session = getSession()!
  const { toast } = useToast()
  const settings = getSettings(session.userId)
  const sym = settings.currencySymbol

  const [assets, setAssets] = useState(() => getAssets(session.userId))
  const [activeType, setActiveType] = useState<AssetType>('stocks')
  const [addModal, setAddModal] = useState(false)
  const [editAccount, setEditAccount] = useState<AssetAccount | null>(null)
  const [updateAccount, setUpdateAccount] = useState<AssetAccount | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<AssetAccount | null>(null)

  const totalNetWorth = assets.reduce((s, a) => s + a.currentValue, 0)

  function refresh() {
    setAssets(getAssets(session.userId))
  }

  function handleAdd(data: Omit<AssetAccount, 'id' | 'history' | 'lastUpdated'> | AssetAccount) {
    if ('id' in data) return
    addAsset(session.userId, data as Omit<AssetAccount, 'id' | 'history' | 'lastUpdated'>)
    refresh()
    setAddModal(false)
    toast.success('Account added')
  }

  function handleEdit(data: Omit<AssetAccount, 'id' | 'history' | 'lastUpdated'> | AssetAccount) {
    if (!('id' in data)) return
    updateAsset(session.userId, data as AssetAccount)
    refresh()
    setEditAccount(null)
    toast.success('Account updated')
  }

  function handleUpdateValue(account: AssetAccount, newValue: number) {
    updateAsset(session.userId, { ...account, currentValue: newValue })
    refresh()
    setUpdateAccount(null)
    toast.success('Value updated')
  }

  function handleDelete(account: AssetAccount) {
    deleteAsset(session.userId, account.id)
    refresh()
    setDeleteConfirm(null)
    toast.success('Account removed')
  }

  const typeAssets = assets.filter(a => a.type === activeType)
  const meta = ASSET_META[activeType]
  const typeTotal = typeAssets.reduce((s, a) => s + a.currentValue, 0)
  const typeGoalTotal = typeAssets.reduce((s, a) => s + (a.goalValue ?? 0), 0)

  return (
    <PageTransition>
      <div className="p-container-padding max-w-5xl mx-auto pb-12 space-y-section-margin">
        {/* Header */}
        <div className="pt-2 flex items-start justify-between">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Asset Portfolio</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Total: {sym}{totalNetWorth.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => setAddModal(true)}
            className="teal-gradient text-white px-5 py-3 rounded-xl font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            Add Account
          </button>
        </div>

        {/* Asset type tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-container-padding px-container-padding">
          {ASSET_ORDER.map(type => {
            const m = ASSET_META[type]
            const total = assets.filter(a => a.type === type).reduce((s, a) => s + a.currentValue, 0)
            const isActive = type === activeType
            return (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl whitespace-nowrap font-label-sm text-label-sm transition-all active:scale-95 shrink-0 ${
                  isActive
                    ? 'text-white shadow-ambient'
                    : 'bg-surface-container-lowest border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                }`}
                style={isActive ? { backgroundColor: m.color } : {}}
              >
                <span className="material-symbols-outlined text-[16px]">{m.icon}</span>
                {m.label}
                {total > 0 && (
                  <span className={`font-label-xs text-label-xs ${isActive ? 'text-white/80' : 'text-on-surface-variant'}`}>
                    {sym}{total >= 1000 ? `${(total / 1000).toFixed(0)}K` : total.toLocaleString()}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Active type section */}
        <div>
          {/* Type header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: meta.color + '20' }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: meta.color }}>
                  {meta.icon}
                </span>
              </div>
              <div>
                <h3 className="font-headline-md text-headline-md text-on-surface">{meta.label}</h3>
                <p className="font-label-xs text-label-xs text-on-surface-variant">{meta.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
                {sym}{typeTotal.toLocaleString()}
              </p>
              {typeGoalTotal > 0 && (
                <p className="font-label-xs text-label-xs text-on-surface-variant">
                  Goal: {sym}{typeGoalTotal.toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Accounts list */}
          {typeAssets.length === 0 ? (
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-12 text-center shadow-ambient">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: meta.color + '15' }}
              >
                <span className="material-symbols-outlined text-[28px]" style={{ color: meta.color }}>
                  {meta.icon}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface mb-1">No {meta.label} accounts yet</p>
              <p className="font-label-xs text-label-xs text-on-surface-variant mb-4">{meta.description}</p>
              <button
                onClick={() => setAddModal(true)}
                className="teal-gradient text-white px-5 py-2.5 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
              >
                Add {meta.label}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {typeAssets.map(account => {
                const pct = account.goalValue && account.goalValue > 0
                  ? Math.min((account.currentValue / account.goalValue) * 100, 100)
                  : null
                const portfolioShare = totalNetWorth > 0 ? (account.currentValue / totalNetWorth) * 100 : 0

                return (
                  <div
                    key={account.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-label-sm text-label-sm text-on-surface font-semibold">{account.name}</p>
                        {account.notes && (
                          <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">{account.notes}</p>
                        )}
                        <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                          {portfolioShare.toFixed(1)}% of total portfolio · updated {account.lastUpdated}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-headline-md text-headline-md text-on-surface font-bold tabular-nums">
                          {sym}{account.currentValue.toLocaleString()}
                        </p>
                        {account.goalValue && (
                          <p className="font-label-xs text-label-xs text-on-surface-variant">
                            Goal: {sym}{account.goalValue.toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>

                    {pct !== null && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-label-xs text-label-xs text-on-surface-variant">Progress to goal</span>
                          <span className="font-label-xs text-label-xs font-bold" style={{ color: meta.color }}>
                            {pct.toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-surface-container-high rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, backgroundColor: meta.color }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setUpdateAccount(account)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-surface-container font-label-xs text-label-xs text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">edit</span>
                        Update Value
                      </button>
                      <button
                        onClick={() => setEditAccount(account)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant font-label-xs text-label-xs text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">tune</span>
                        Details
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(account)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-error/30 font-label-xs text-label-xs text-error hover:bg-error-container active:scale-95 transition-all"
                      >
                        <span className="material-symbols-outlined text-[15px]">delete</span>
                      </button>
                    </div>
                  </div>
                )
              })}

              <button
                onClick={() => setAddModal(true)}
                className="w-full py-3 rounded-xl border-2 border-dashed border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:border-secondary/40 hover:text-secondary transition-all active:scale-[0.98]"
              >
                + Add another {meta.label} account
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add modal */}
      {addModal && (
        <AssetModal
          type={activeType}
          sym={sym}
          onSave={handleAdd}
          onClose={() => setAddModal(false)}
        />
      )}

      {/* Edit modal */}
      {editAccount && (
        <AssetModal
          type={editAccount.type}
          existing={editAccount}
          sym={sym}
          onSave={handleEdit}
          onClose={() => setEditAccount(null)}
        />
      )}

      {/* Update value modal */}
      {updateAccount && (
        <UpdateValueModal
          account={updateAccount}
          sym={sym}
          onSave={v => handleUpdateValue(updateAccount, v)}
          onClose={() => setUpdateAccount(null)}
        />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-surface rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-modal-in">
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-error text-[24px]">delete</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Remove Account?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              "{deleteConfirm.name}" and its history will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 rounded-lg bg-error text-on-error font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
