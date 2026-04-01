import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PrivateRoute } from './PrivateRoute'

import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'

import ClientList from '@/pages/clients/ClientList'
import ClientForm from '@/pages/clients/ClientForm'

import ExportList from '@/pages/exports/ExportList'
import ExportForm from '@/pages/exports/ExportForm'
import ExportDetail from '@/pages/exports/ExportDetail'

import ImportList from '@/pages/imports/ImportList'
import ImportForm from '@/pages/imports/ImportForm'
import ImportDetail from '@/pages/imports/ImportDetail'

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [{ path: '/login', element: <Login /> }],
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/clients', element: <ClientList /> },
          { path: '/clients/new', element: <ClientForm /> },
          { path: '/clients/:id/edit', element: <ClientForm /> },
          { path: '/exports', element: <ExportList /> },
          { path: '/exports/new', element: <ExportForm /> },
          { path: '/exports/:id', element: <ExportDetail /> },
          { path: '/exports/:id/edit', element: <ExportForm /> },
          { path: '/imports', element: <ImportList /> },
          { path: '/imports/new', element: <ImportForm /> },
          { path: '/imports/:id', element: <ImportDetail /> },
          { path: '/imports/:id/edit', element: <ImportForm /> },
        ],
      },
    ],
  },
])
