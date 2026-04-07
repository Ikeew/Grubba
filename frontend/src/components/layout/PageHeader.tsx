import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

interface PageHeaderProps {
  title: string
  description?: string
  backTo?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
}

export function PageHeader({ title, description, backTo, action, secondaryAction }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-start gap-3">
        {backTo && (
          <button
            onClick={() => navigate(backTo)}
            className="no-print mt-0.5 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Voltar"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
        </div>
      </div>
      {(action || secondaryAction) && (
        <div className="no-print flex items-center gap-2">
          {secondaryAction && (
            <Button variant="secondary" onClick={secondaryAction.onClick}>{secondaryAction.label}</Button>
          )}
          {action && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
        </div>
      )}
    </div>
  )
}
