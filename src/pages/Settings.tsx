import { useState, useRef } from 'react'
import { getSession } from '../auth/session'
import { getSettings, saveSettings } from '../store/settings'
import { exportAllData, importAllData } from '../store/exportData'
import { getUsers } from '../auth/users'
import { getNetWorthGoal, saveNetWorthGoal } from '../store/networthGoal'
import { useToast } from '../hooks/useToast'
import PageTransition from '../components/PageTransition'
import type { AppSettings } from '../store/types'

export default function Settings() {
  const session = getSession()!
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings] = useState<AppSettings>(() => getSettings(session.userId))
  const [name, setName] = useState(session.name)
  const [nameEdited, setNameEdited] = useState(false)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [importPreview, setImportPreview] = useState<{ assetCount: number; file: File } | null>(null)

  const storedGoal = getNetWorthGoal(session.userId)
  const [goalAmount, setGoalAmount] = useState(storedGoal?.targetAmount?.toString() ?? '')
  const [goalDate, setGoalDate] = useState(storedGoal?.targetDate ?? '')
  const [goalDirty, setGoalDirty] = useState(false)

  function handleSaveSettings() {
    saveSettings(session.userId, settings)
    toast.success('Settings saved')
  }

  function handleSaveGoal() {
    const amount = Number(goalAmount)
    if (!goalAmount || isNaN(amount) || amount <= 0) {
      toast.error('Enter a valid goal amount')
      return
    }
    saveNetWorthGoal(session.userId, {
      targetAmount: amount,
      targetDate: goalDate || undefined,
    })
    setGoalDirty(false)
    toast.success('Net worth goal saved')
  }

  function handleSaveName() {
    const users = getUsers()
    const updated = users.map(u => u.id === session.userId ? { ...u, name } : u)
    localStorage.setItem('lumina_users', JSON.stringify(updated))
    const raw = localStorage.getItem('lumina_session')
    if (raw) {
      const s = JSON.parse(raw)
      localStorage.setItem('lumina_session', JSON.stringify({ ...s, name }))
    }
    setNameEdited(false)
    toast.success('Display name updated — refresh to see changes in the sidebar')
  }

  function handleExport() {
    const json = exportAllData(session.userId)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lumina-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported successfully')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const json = ev.target?.result as string
        const payload = JSON.parse(json)
        if (payload.version !== 2) throw new Error('Unsupported version')
        setImportPreview({ assetCount: payload.assets?.length ?? 0, file })
      } catch {
        toast.error('Invalid export file. Please use a Lumina Finance v2 export.')
        if (fileInputRef.current) fileInputRef.current.value = ''
      }
    }
    reader.readAsText(file)
  }

  function handleConfirmImport() {
    if (!importPreview) return
    const reader = new FileReader()
    reader.onload = ev => {
      try {
        importAllData(session.userId, ev.target?.result as string)
        toast.success(`Data imported successfully (${importPreview.assetCount} asset accounts)`)
        setImportPreview(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
      } catch {
        toast.error('Import failed. File may be corrupted.')
      }
    }
    reader.readAsText(importPreview.file)
  }

  function handleClearData() {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(`lumina_${session.userId}_`))
    keys.forEach(k => localStorage.removeItem(k))
    toast.success('All your data has been cleared')
    setClearConfirm(false)
  }

  const CURRENCIES = [
    { code: 'USD', symbol: '$',   label: 'US Dollar' },
    { code: 'EUR', symbol: '€',   label: 'Euro' },
    { code: 'GBP', symbol: '£',   label: 'British Pound' },
    { code: 'JPY', symbol: '¥',   label: 'Japanese Yen' },
    { code: 'CAD', symbol: 'CA$', label: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$',  label: 'Australian Dollar' },
    { code: 'CHF', symbol: 'Fr',  label: 'Swiss Franc' },
    { code: 'INR', symbol: '₹',   label: 'Indian Rupee' },
  ]

  return (
    <PageTransition>
      <div className="p-container-padding max-w-3xl mx-auto space-y-section-margin pb-12">
        {/* Header */}
        <div className="pt-2">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Settings</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">Manage your account and preferences</p>
        </div>

        {/* Net Worth Goal */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-on-surface">Net Worth Goal</h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
                  Target Amount ({settings.currencySymbol})
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-body-md text-on-surface-variant">
                    {settings.currencySymbol}
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="e.g. 1000000"
                    value={goalAmount}
                    onChange={e => { setGoalAmount(e.target.value); setGoalDirty(true) }}
                    className="w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>
              <div>
                <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
                  Target Date — optional
                </label>
                <input
                  type="text"
                  placeholder="e.g. 2030"
                  value={goalDate}
                  onChange={e => { setGoalDate(e.target.value); setGoalDirty(true) }}
                  className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30"
                />
              </div>
            </div>
            {goalDirty && (
              <button
                onClick={handleSaveGoal}
                className="teal-gradient text-white px-6 py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
              >
                Save Goal
              </button>
            )}
            {!goalDirty && storedGoal && (
              <p className="font-label-xs text-label-xs text-secondary">
                Goal set: {settings.currencySymbol}{storedGoal.targetAmount.toLocaleString()}
                {storedGoal.targetDate ? ` by ${storedGoal.targetDate}` : ''}
              </p>
            )}
          </div>
        </section>

        {/* Profile */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-on-surface">Profile</h3>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full teal-gradient flex items-center justify-center text-white font-bold text-xl shrink-0">
                {(nameEdited ? name : session.name).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-label-sm text-label-sm text-on-surface font-semibold">{session.name}</p>
                <p className="font-label-xs text-label-xs text-on-surface-variant">{session.email}</p>
              </div>
            </div>
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Display Name</label>
              <div className="flex gap-3">
                <input
                  type="text" value={name}
                  onChange={e => { setName(e.target.value); setNameEdited(true) }}
                  className="flex-1 bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all"
                />
                {nameEdited && (
                  <button onClick={handleSaveName}
                    className="teal-gradient text-white px-4 py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform">
                    Save
                  </button>
                )}
              </div>
            </div>
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Email</label>
              <input type="email" value={session.email} disabled
                className="w-full bg-surface-container-highest rounded-lg px-4 py-3 font-body-md text-on-surface-variant opacity-70 cursor-not-allowed" />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-on-surface">Preferences</h3>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Currency</label>
              <select
                value={settings.currency}
                onChange={e => {
                  const c = CURRENCIES.find(x => x.code === e.target.value)
                  if (c) setSettings(s => ({ ...s, currency: c.code, currencySymbol: c.symbol }))
                }}
                className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border-none"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>{c.symbol} — {c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Date Format</label>
              <select
                value={settings.dateFormat}
                onChange={e => setSettings(s => ({ ...s, dateFormat: e.target.value as AppSettings['dateFormat'] }))}
                className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 border-none"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (EU)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </div>
            <button onClick={handleSaveSettings}
              className="teal-gradient text-white px-6 py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform">
              Save Preferences
            </button>
          </div>
        </section>

        {/* Data management */}
        <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-ambient overflow-hidden">
          <div className="px-6 py-4 border-b border-outline-variant/30">
            <h3 className="font-headline-md text-headline-md text-on-surface">Data Management</h3>
          </div>
          <div className="p-6 space-y-6">
            {/* Export */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface font-medium">Export Data</p>
                <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                  Download all your assets, income, budget, and settings as a JSON file.
                </p>
              </div>
              <button onClick={handleExport}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Export
              </button>
            </div>

            <div className="border-t border-outline-variant/20" />

            {/* Import */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface font-medium">Import Data</p>
                  <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                    Restore from a Lumina Finance JSON export. This will overwrite your current data.
                  </p>
                </div>
                <button onClick={() => fileInputRef.current?.click()}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg font-label-sm text-label-sm text-on-surface hover:bg-surface-container active:scale-95 transition-all">
                  <span className="material-symbols-outlined text-[18px]">upload</span>
                  Import
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} />

              {importPreview && (
                <div className="mt-3 p-4 rounded-xl bg-secondary/10 border border-secondary/20">
                  <p className="font-label-sm text-label-sm text-on-surface font-medium mb-1">Ready to import</p>
                  <p className="font-label-xs text-label-xs text-on-surface-variant mb-3">
                    Found <strong>{importPreview.assetCount}</strong> asset accounts. This will replace all your current data.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { setImportPreview(null); if (fileInputRef.current) fileInputRef.current.value = '' }}
                      className="flex-1 py-2 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">
                      Cancel
                    </button>
                    <button onClick={handleConfirmImport}
                      className="flex-1 py-2 rounded-lg teal-gradient text-white font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform">
                      Confirm Import
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-outline-variant/20" />

            {/* Clear data */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-label-sm text-label-sm text-on-surface font-medium">Clear All Data</p>
                <p className="font-label-xs text-label-xs text-on-surface-variant mt-0.5">
                  Permanently delete all your assets, income, budget, and settings. Cannot be undone.
                </p>
              </div>
              <button onClick={() => setClearConfirm(true)}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 border border-error/40 text-error rounded-lg font-label-sm text-label-sm hover:bg-error-container active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                Clear
              </button>
            </div>
          </div>
        </section>

        {/* App info */}
        <div className="text-center pb-8">
          <p className="font-label-xs text-label-xs text-outline">Lumina Finance · Personal Wealth Planner · v2.0.0</p>
          <p className="font-label-xs text-label-xs text-outline mt-1">All data stored locally in your browser</p>
        </div>
      </div>

      {/* Clear confirm dialog */}
      {clearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setClearConfirm(false)} />
          <div className="relative bg-surface rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-modal-in">
            <div className="w-12 h-12 rounded-full bg-error-container flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-error text-[24px]">warning</span>
            </div>
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Clear All Data?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              This will permanently delete all your assets, income, budget goals, and settings. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setClearConfirm(false)}
                className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">
                Cancel
              </button>
              <button onClick={handleClearData}
                className="flex-1 py-3 rounded-lg bg-error text-on-error font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all">
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
