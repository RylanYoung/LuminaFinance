import { useToast, type Toast } from '../hooks/useToast'

const ICONS: Record<Toast['type'], string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
}

const COLORS: Record<Toast['type'], string> = {
  success: 'border-secondary bg-surface text-secondary',
  error: 'border-error bg-surface text-error',
  info: 'border-outline bg-surface text-on-surface',
  warning: 'border-[#F59E0B] bg-surface text-[#B45309]',
}

const ICON_COLORS: Record<Toast['type'], string> = {
  success: 'text-secondary',
  error: 'text-error',
  info: 'text-outline',
  warning: 'text-[#F59E0B]',
}

export default function ToastContainer() {
  const { toasts, dismiss } = useToast()

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border shadow-ambient min-w-[280px] max-w-[360px] animate-toast-in ${COLORS[t.type]}`}
        >
          <span className={`material-symbols-outlined text-[20px] shrink-0 ${ICON_COLORS[t.type]}`}
            style={{ fontVariationSettings: "'FILL' 1" }}>
            {ICONS[t.type]}
          </span>
          <p className="font-label-sm text-label-sm flex-1 text-on-surface">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-outline hover:text-on-surface transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      ))}
    </div>
  )
}
