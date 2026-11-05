import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { canManageBilling } from '@/utils/permissions'

export function BillingRoute() {
  const { user } = useAuth()
  return canManageBilling(user) ? <Outlet /> : <Navigate to="/dashboard" replace />
}
