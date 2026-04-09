import { useState, useRef, useEffect } from 'react'

interface PortOption {
  value: string
  label: string
}

interface PortComboboxProps {
  label?: string
  value: string
  onChange: (value: string) => void
  ports: PortOption[]
  error?: string
  canCreate?: boolean
}

export function PortCombobox({ label, value, onChange, ports, error, canCreate }: PortComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const selectedLabel = ports.find((p) => p.value === value)?.label ?? ''

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = query.trim()
    ? ports.filter((p) => p.label.toLowerCase().includes(query.toLowerCase()))
    : ports

  function handleSelect(portValue: string) {
    onChange(portValue)
    setOpen(false)
  }

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-slate-700">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={`
            block w-full rounded-md border px-3 py-2 text-sm shadow-sm bg-white text-left
            focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500
            ${error ? 'border-red-400' : 'border-slate-300'}
          `}
        >
          {selectedLabel || <span className="text-slate-400">Selecionar porto...</span>}
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            <div className="p-2 border-b border-slate-100">
              <input
                autoFocus
                type="text"
                placeholder="Buscar porto..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <ul className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-400">Nenhum porto encontrado</li>
              ) : (
                filtered.map((p) => (
                  <li
                    key={p.value}
                    onClick={() => handleSelect(p.value)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-brand-50 hover:text-brand-700 ${
                      p.value === value ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {p.label}
                  </li>
                ))
              )}
            </ul>
            {canCreate && (
              <div className="border-t border-slate-100">
                <a
                  href="/ports/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium"
                  onClick={() => setOpen(false)}
                >
                  <span className="text-base leading-none">+</span> Cadastrar porto
                </a>
              </div>
            )}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
