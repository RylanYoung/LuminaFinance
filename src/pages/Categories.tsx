import { useState, useEffect } from 'react'
import { getSession } from '../auth/session'
import { getCategories, addCategory, updateCategory, deleteCategory } from '../store/categories'
import { getTransactions } from '../store/transactions'
import { generateId } from '../utils'
import { useToast } from '../hooks/useToast'
import EmptyState from '../components/EmptyState'
import PageTransition from '../components/PageTransition'
import type { Category } from '../store/types'

const ICONS = [
  'restaurant', 'shopping_bag', 'home', 'directions_car', 'favorite', 'movie',
  'flight', 'school', 'bolt', 'more_horiz', 'payments', 'laptop', 'trending_up',
  'business', 'card_giftcard', 'attach_money', 'coffee', 'sports_esports', 'fitness_center',
  'local_hospital', 'pets', 'child_care', 'savings', 'diamond', 'beach_access',
  'music_note', 'book', 'phone', 'wifi', 'local_gas_station',
]

const COLORS = [
  '#F59E0B', '#8B5CF6', '#3B82F6', '#6B7280', '#EF4444', '#EC4899',
  '#14B8A6', '#F97316', '#84CC16', '#9CA3AF', '#006a61', '#0D9488',
  '#0F172A', '#1E40AF', '#DB2777', '#64748B', '#DC2626', '#7C3AED',
  '#059669', '#D97706',
]

function CategoryModal({ category, onClose, onSaved }: {
  category?: Category | null; onClose: () => void; onSaved: (cat: Category) => void
}) {
  const [name, setName] = useState(category?.name ?? '')
  const [icon, setIcon] = useState(category?.icon ?? 'payments')
  const [color, setColor] = useState(category?.color ?? '#006a61')
  const [type, setType] = useState<Category['type']>(category?.type ?? 'expense')
  const [err, setErr] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setErr('Name is required'); return }
    onSaved({
      id: category?.id ?? generateId(),
      name: name.trim(), icon, color, type,
      isDefault: category?.isDefault,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-2xl max-w-sm w-full animate-modal-in overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/30">
          <h3 className="font-headline-md text-headline-md text-on-surface">{category ? 'Edit Category' : 'New Category'}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Preview */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
              <span className="material-symbols-outlined text-[24px]" style={{ color }}>{icon}</span>
            </div>
            <div>
              <p className="font-label-sm text-label-sm text-on-surface font-medium">{name || 'Category Name'}</p>
              <p className="font-label-xs text-label-xs text-on-surface-variant capitalize">{type}</p>
            </div>
          </div>

          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-1 block">Name</label>
            <input type="text" placeholder="e.g. Coffee & Cafés" value={name}
              onChange={e => { setName(e.target.value); setErr('') }}
              className="w-full bg-surface-container rounded-lg px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-secondary/30 transition-all" />
            {err && <p className="text-error font-label-xs text-label-xs mt-1">{err}</p>}
          </div>

          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-2 block">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['expense', 'income', 'both'] as const).map(t => (
                <button key={t} type="button" onClick={() => setType(t)}
                  className={`py-2 rounded-lg font-label-sm text-label-sm capitalize transition-all active:scale-95 ${
                    type === t ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}>{t}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-label-xs text-label-xs text-on-surface-variant uppercase mb-2 block">Icon</label>
            <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto pr-1">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all active:scale-90 ${
                    icon === ic ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                  }`}>
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
                  className={`w-8 h-8 rounded-full transition-all active:scale-90 ${color === c ? 'ring-2 ring-offset-2 ring-on-surface scale-110' : ''}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </form>
        <div className="flex gap-3 px-6 py-4 border-t border-outline-variant/30">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">
            Cancel
          </button>
          <button onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="flex-1 teal-gradient text-white py-3 rounded-lg font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform">
            {category ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Categories() {
  const session = getSession()!
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [usageMap, setUsageMap] = useState<Record<string, number>>({})
  const [modal, setModal] = useState<{ open: boolean; editing?: Category | null }>({ open: false })
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all')

  function load() {
    const uid = session.userId
    setCategories(getCategories(uid))
    const txs = getTransactions(uid)
    const map: Record<string, number> = {}
    txs.forEach(t => { map[t.categoryId] = (map[t.categoryId] ?? 0) + 1 })
    setUsageMap(map)
  }

  useEffect(() => { load() }, [])

  function handleSave(cat: Category) {
    const uid = session.userId
    if (modal.editing) { updateCategory(uid, cat); toast.success('Category updated') }
    else { addCategory(uid, cat); toast.success('Category created') }
    setModal({ open: false })
    load()
  }

  function handleDelete() {
    if (!deleteTarget) return
    if (usageMap[deleteTarget.id] > 0) {
      toast.error(`Cannot delete — this category has ${usageMap[deleteTarget.id]} transaction(s)`)
      setDeleteTarget(null)
      return
    }
    deleteCategory(session.userId, deleteTarget.id)
    toast.success('Category deleted')
    setDeleteTarget(null)
    load()
  }

  const filtered = categories.filter(c => typeFilter === 'all' || c.type === typeFilter || c.type === 'both')

  return (
    <PageTransition>
      <div className="p-container-padding max-w-4xl mx-auto space-y-section-margin">
        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Categories</h2>
            <p className="font-body-md text-body-md text-on-surface-variant">Organise transactions with custom categories</p>
          </div>
          <button onClick={() => setModal({ open: true })}
            className="teal-gradient text-white px-5 py-3 rounded-xl font-label-sm text-label-sm shadow-ambient active:scale-95 transition-transform flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Category
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          {(['all', 'expense', 'income'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-full font-label-xs text-label-xs capitalize transition-all active:scale-95 ${
                typeFilter === t ? 'bg-secondary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}>{t === 'all' ? 'All' : t === 'expense' ? 'Expenses' : 'Income'}</button>
          ))}
          <span className="ml-auto font-label-xs text-label-xs text-on-surface-variant self-center">{filtered.length} categories</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="category" title="No categories"
            description="Create categories to organise your transactions"
            action={{ label: 'New Category', onClick: () => setModal({ open: true }) }} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {filtered.map(cat => {
              const uses = usageMap[cat.id] ?? 0
              return (
                <div key={cat.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 shadow-ambient group flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat.color}20` }}>
                    <span className="material-symbols-outlined text-[24px]" style={{ color: cat.color }}>{cat.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-sm text-label-sm text-on-surface font-medium truncate">{cat.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`font-label-xs text-[10px] px-1.5 py-0.5 rounded capitalize font-semibold ${
                        cat.type === 'income' ? 'bg-secondary/10 text-secondary' :
                        cat.type === 'expense' ? 'bg-primary/10 text-on-surface' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>{cat.type}</span>
                      <span className="font-label-xs text-label-xs text-on-surface-variant">{uses} tx</span>
                      {cat.isDefault && <span className="font-label-xs text-[10px] text-outline">default</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => setModal({ open: true, editing: cat })}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-all active:scale-90">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    {!cat.isDefault && (
                      <button onClick={() => setDeleteTarget(cat)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition-all active:scale-90">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {modal.open && (
        <CategoryModal category={modal.editing} onClose={() => setModal({ open: false })} onSaved={handleSave} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-surface rounded-2xl p-6 shadow-2xl max-w-sm w-full animate-modal-in">
            <h3 className="font-headline-md text-headline-md text-on-surface mb-2">Delete "{deleteTarget.name}"?</h3>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              {(usageMap[deleteTarget.id] ?? 0) > 0
                ? `This category is used by ${usageMap[deleteTarget.id]} transaction(s) and cannot be deleted.`
                : 'This category will be permanently removed.'}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-3 rounded-lg border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:bg-surface-container active:scale-95 transition-all">
                {(usageMap[deleteTarget.id] ?? 0) > 0 ? 'OK' : 'Cancel'}
              </button>
              {(usageMap[deleteTarget.id] ?? 0) === 0 && (
                <button onClick={handleDelete}
                  className="flex-1 py-3 rounded-lg bg-error text-on-error font-label-sm text-label-sm hover:opacity-90 active:scale-95 transition-all">
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  )
}
