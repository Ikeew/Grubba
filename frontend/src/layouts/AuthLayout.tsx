import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Grubba</h1>
          <p className="text-sm text-slate-500 mt-1">Logística Portuária</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
