import { useAuth } from '@/contexts/AuthContext'
import { useClientList } from '@/hooks/useClients'
import { useExportList } from '@/hooks/useExports'
import { useImportList } from '@/hooks/useImports'
import { Spinner } from '@/components/ui/Spinner'

function StatCard({ label, value, color }: { label: string; value: number | undefined; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color}`}>
        {value ?? <Spinner size="sm" />}
      </p>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const { data: clients } = useClientList({ page_size: 1 })
  const { data: exports } = useExportList({ page_size: 1 })
  const { data: importsData } = useImportList({ page_size: 1 })
  const { data: inProgress } = useExportList({ status: ['in_progress'], page_size: 1 })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Bom dia, {user?.full_name?.split(' ')[0]}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">Visão geral do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Clientes ativos" value={clients?.total} color="text-slate-900" />
        <StatCard label="Fichas de exportação" value={exports?.total} color="text-blue-700" />
        <StatCard label="Fichas de importação" value={importsData?.total} color="text-indigo-700" />
        <StatCard label="Exportações em andamento" value={inProgress?.total} color="text-amber-600" />
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Acesso rápido
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Nova ficha de exportação', href: '/exports/new' },
            { label: 'Nova ficha de importação', href: '/imports/new' },
            { label: 'Cadastrar cliente', href: '/clients/new' },
            { label: 'Ver exportações', href: '/exports' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center justify-center text-center text-sm font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-lg px-4 py-3 transition-colors"
            >
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
