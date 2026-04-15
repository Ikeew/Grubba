import { useEffect, useRef, useState } from 'react'

interface Option {
  value: string
  label: string
}

interface Props {
  options: Option[]
  value: string[]
  onChange: (values: string[]) => void
  className?: string
}

export function StatusMultiSelect({ options, value, onChange, className = '' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function toggle(v: string) {
    if (value.includes(v)) {
      onChange(value.filter((x) => x !== v))
    } else {
      onChange([...value, v])
    }
  }

  function selectAll() {
    onChange(options.map((o) => o.value))
  }

  function clearAll() {
    onChange([])
  }

  const allSelected = value.length === options.length
  const label =
    value.length === 0
      ? 'Nenhum status'
      : allSelected
        ? 'Todos os status'
        : `${value.length} status`

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-1 border border-slate-300 rounded-md px-3 py-1.5 text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 hover:bg-slate-50 transition-colors"
      >
        <span className="truncate">{label}</span>
        <svg className="w-4 h-4 text-slate-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-56 bg-white border border-slate-200 rounded-md shadow-lg">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-brand-600 hover:text-brand-800 font-medium"
            >
              Todos
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-slate-700"
            >
              Limpar
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {options.map((opt) => (
              <label
                key={opt.value}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={value.includes(opt.value)}
                  onChange={() => toggle(opt.value)}
                  className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
