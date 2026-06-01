interface Props {
  page: number
  pages: number
  total: number
  pageSize: number
  onPage: (p: number) => void
}

export function Pagination({ page, pages, total, pageSize, onPage }: Props) {
  if (pages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const pageNumbers: (number | '...')[] = []
  if (pages <= 7) {
    for (let i = 1; i <= pages; i++) pageNumbers.push(i)
  } else {
    pageNumbers.push(1)
    if (page > 3) pageNumbers.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(pages - 1, page + 1); i++) pageNumbers.push(i)
    if (page < pages - 2) pageNumbers.push('...')
    pageNumbers.push(pages)
  }

  return (
    <div className="flex items-center justify-between px-3 py-2 border-t border-slate-200 bg-white text-xs text-slate-500">
      <span>{from}–{to} de {total}</span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ‹
        </button>
        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="px-1">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPage(p)}
              className={`w-7 h-7 rounded text-xs font-medium ${
                p === page
                  ? 'bg-brand-600 text-white'
                  : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className="px-2 py-1 rounded hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ›
        </button>
      </div>
    </div>
  )
}
