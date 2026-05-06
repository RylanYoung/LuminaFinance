import { useState, useEffect } from 'react'
import { addTransaction, updateTransaction } from '../store/transactions'
import { getCategories } from '../store/categories'
import { generateId, todayISO } from '../utils'
import type { Transaction } from '../store/types'
import { useToast } from '../hooks/useToast'

interface Props {
  userId: string
  transaction?: Transaction | null
  onClose: () => void
  onSaved: () => void
}

export default function TransactionModal({ userId, transaction, onClose, onSaved }: Props) {
  const { toast } = useToast()
  const isEdit = !!transaction
  const categories = getCategories(userId)

  const [type, setType] = useState<'income' | 'expense'>(transaction?.type ?? 'expense')
  const [amount, setAmount] = useState(transaction?.amount.toString() ?? '')
  const [description, setDescription] = useState(transaction?.description ?? '')
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? '')
  const [date, setDate] = useState(transaction?.date ?? todayISO())
  const [notes, setNotes] = useState(transaction?.notes ?? '')
  const [isRecurring, setIsRecurring] = useState(transaction?.isRecurringTemplate ?? false)
  const [recurringFreq, setRecurringFreq] = useState<'monthly' | 'weekly'>(transaction?.recurringFrequency ?? 'monthly')
  const [recurringDay, setRecurringDay] = useState(transaction?.recurringDay?.toString() ?? '1')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filteredCats = categories.filter(c => c.type === type || c.type === 'both')

  useEffect(() => {
    if (!categoryId || !filteredCats.find(c => c.id === categoryId)) {
      setCategoryId(filteredCats[0]?.id ?? '')
    }
  }, [type])

  function validate(): boolean {
    const e: Record<string, string> = {}
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) e.amount = 'Enter a valid positive amount'
    if (!description.trim()) e.description = 'Description is required'
    if (!categoryId) e.categoryId = 'Select a category'
    if (!date) e.date = 'Date is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    const tx: Transaction = {
      id: transaction?.id ?? generateId(),
      type,
      amount: parseFloat(amount),
      description: description.trim(),
      categoryId,
      date,
      notes: notes.trim() || undefined,
      isRecurringTemplate: isRecurring || undefined,
      recurringFrequency: isRecurring ? recurringFreq : undefined,
      recurringDay: isRecurring ? parseInt(recurringDay) : undefined,
    }

    if (isEdit) {
      updateTransaction(userId, tx)
      toast.success('Transaction updated')
    } else {
      addTransaction(userId, tx)
      toast.success('Transaction added')
    }
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 shrink-0">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {isEdit ? 'Edit Transaction' : 'Add Transaction'}
          </h2>
          <button onClick={onClose} className="text-outline hover:text-on-surface transition-colors active:scale-95">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Type toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-surface-container rounded-lg">
            {(['expense', 'income'] as const).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`py-2 rounded-lg font-label-sm text-label-sm transition-all active:scale-95 capitalize ${
                  type === t
                    ? t === 'expense'
                      ? 'bg-primary text-on-primary shadow-sm'
                      : 'teal-gradient text-white shadow-sm'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount */}
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Amount</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-headline-md text-on-surface-variant">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={e => { setAmount(e.target.value); setErrors(p => ({ ...p, amount: '' })) }}
                className={`w-full bg-surface-container rounded-lg pl-8 pr-4 py-3 font-headline-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all ${errors.amount ? 'ring-2 ring-error' : ''}`}
              />
            </div>
            {errors.amount && <p className="text-error font-label-xs text-label-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Description</label>
            <input
              type="text"
              placeholder="e.g. Grocery run at Whole Foods"
              value={description}
              onChange={e => { setDescription(e.target.value); setErrors(p => ({ ...p, description: '' })) }}
              className={`w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all ${errors.description ? 'ring-2 ring-error' : ''}`}
            />
            {errors.description && <p className="text-error font-label-xs text-label-xs mt-1">{errors.description}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-2 block">Category</label>
            <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredCats.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setCategoryId(cat.id); setErrors(p => ({ ...p, categoryId: '' })) }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all active:scale-95 text-center ${
                    categoryId === cat.id
                      ? 'border-secondary bg-secondary/10'
                      : 'border-outline-variant/50 hover:bg-surface-container-low'
                  }`}
                >
                  <span className="material-symbols-outlined text-[20px]" style={{ color: cat.color }}>{cat.icon}</span>
                  <span className="font-label-xs text-label-xs text-on-surface leading-tight">{cat.name}</span>
                </button>
              ))}
            </div>
            {errors.categoryId && <p className="text-error font-label-xs text-label-xs mt-1">{errors.categoryId}</p>}
          </div>

          {/* Date */}
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => { setDate(e.target.value); setErrors(p => ({ ...p, date: '' })) }}
              className={`w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all ${errors.date ? 'ring-2 ring-error' : ''}`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Notes (optional)</label>
            <textarea
              placeholder="Any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all resize-none"
            />
          </div>

          {/* Recurring */}
          <div className="bg-surface-container rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={e => setIsRecurring(e.target.checked)}
                  className="peer w-5 h-5 rounded border-2 border-outline-variant checked:bg-secondary checked:border-secondary cursor-pointer appearance-none transition-all"
                />
                <span className="material-symbols-outlined absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[14px] pointer-events-none"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 600" }}>check</span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface">Recurring transaction</span>
            </label>
            {isRecurring && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Frequency</label>
                  <select
                    value={recurringFreq}
                    onChange={e => setRecurringFreq(e.target.value as 'monthly' | 'weekly')}
                    className="w-full bg-surface rounded-lg px-3 py-2 font-body-md text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
                <div>
                  <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">
                    {recurringFreq === 'monthly' ? 'Day of month' : 'Day of week'}
                  </label>
                  <input
                    type="number"
                    min={recurringFreq === 'monthly' ? 1 : 0}
                    max={recurringFreq === 'monthly' ? 31 : 6}
                    value={recurringDay}
                    onChange={e => setRecurringDay(e.target.value)}
                    className="w-full bg-surface rounded-lg px-3 py-2 font-body-md text-on-surface border border-outline-variant focus:outline-none focus:ring-2 focus:ring-secondary/30"
                  />
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/30 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={e => handleSubmit(e as unknown as React.FormEvent)}
            className="flex-1 teal-gradient text-white py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform"
          >
            {isEdit ? 'Save Changes' : 'Add Transaction'}
          </button>
        </div>
      </div>
    </div>
  )
}
