import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-slate-600">
          {user?.full_name}
          <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
            {user?.role === 'admin' ? 'Admin' : 'Colaborador'}
          </span>
        </span>
        <Button variant="ghost" size="sm" onClick={logout}>
          Sair
        </Button>
      </div>
    </header>
  )
}
