interface CurrencyInputProps {
  sym: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoFocus?: boolean
  onBlur?: () => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  className?: string
}

export default function CurrencyInput({
  sym, value, onChange, placeholder = '0', autoFocus, onBlur, onKeyDown, className = '',
}: CurrencyInputProps) {
  return (
    <div className={`flex items-center bg-surface-container rounded-lg focus-within:ring-2 focus-within:ring-secondary/30 ${className}`}>
      <span className="pl-4 pr-1 font-body-md text-on-surface-variant shrink-0 select-none">
        {sym}
      </span>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        autoFocus={autoFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="flex-1 bg-transparent pr-4 py-3 font-body-md text-on-surface focus:outline-none min-w-0"
      />
    </div>
  )
}
