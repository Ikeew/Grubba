import { useState, useRef, useEffect } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { clientService } from '@/services/client.service'
import { CLIENT_KEYS, useClient } from '@/hooks/useClients'

const PAGE_SIZE = 50

interface ClientComboboxProps {
  label?: string
  value: string
  onChange: (value: string) => void
  error?: string
}

/**
 * Seletor de cliente com busca no servidor.
 * Não carrega uma lista fixa: a cada digitação (com debounce) consulta
 * /clients?search=..., então qualquer cliente ativo pode ser encontrado,
 * independentemente de quantos existam no banco.
 */
export function ClientCombobox({ label, value, onChange, error }: ClientComboboxProps) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setDebouncedQuery('')
    }
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

  const listParams = { page_size: PAGE_SIZE, search: debouncedQuery || undefined }
  const { data, isFetching } = useQuery({
    queryKey: CLIENT_KEYS.list(listParams),
    queryFn: () => clientService.list(listParams),
    enabled: open,
    // Sempre revalida ao abrir, para pegar clientes criados em outra aba ("Criar cliente")
    staleTime: 0,
    placeholderData: keepPreviousData,
  })

  const results = data?.items ?? []
  const hasMore = (data?.total ?? 0) > results.length

  // Nome do cliente selecionado: busca pelo ID, sem depender da lista carregada
  const { data: selectedClient } = useClient(value)
  const selectedLabel = value ? selectedClient?.name ?? '' : ''

  function handleSelect(clientValue: string) {
    onChange(clientValue)
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
          {selectedLabel || <span className="text-slate-400">Selecionar cliente...</span>}
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg">
            <div className="p-2 border-b border-slate-100">
              <input
                autoFocus
                type="text"
                placeholder="Buscar por nome, CNPJ ou e-mail..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <ul className="max-h-52 overflow-y-auto">
              {!data && isFetching ? (
                <li className="px-3 py-2 text-sm text-slate-400">Carregando...</li>
              ) : results.length === 0 ? (
                <li className="px-3 py-2 text-sm text-slate-400">Nenhum cliente encontrado</li>
              ) : (
                results.map((c) => (
                  <li
                    key={c.id}
                    onClick={() => handleSelect(c.id)}
                    className={`px-3 py-2 text-sm cursor-pointer hover:bg-brand-50 hover:text-brand-700 ${
                      c.id === value ? 'bg-brand-50 font-medium text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {c.name}
                    {c.cnpj && <span className="ml-2 text-xs text-slate-400">{c.cnpj}</span>}
                  </li>
                ))
              )}
              {hasMore && (
                <li className="px-3 py-2 text-xs text-slate-400 border-t border-slate-100">
                  Mostrando {results.length} de {data?.total}. Digite para refinar a busca.
                </li>
              )}
            </ul>
            <div className="border-t border-slate-100">
              <a
                href="/clients/new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-sm text-brand-600 hover:bg-brand-50 font-medium"
                onClick={() => setOpen(false)}
              >
                <span className="text-base leading-none">+</span> Criar cliente
              </a>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
