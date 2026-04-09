import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePortList, useDeletePort } from '@/hooks/usePorts'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmModal } from '@/components/shared/ConfirmModal'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import type { Port } from '@/types/port'

export default function PortList() {
  const navigate = useNavigate()
  const [toDelete, setToDelete] = useState<Port | null>(null)

  const { data: ports, isLoading } = usePortList()
  const deletePort = useDeletePort()

  async function handleDelete() {
    if (!toDelete) return
    await deletePort.mutateAsync(toDelete.id)
    setToDelete(null)
  }

  return (
    <div>
      <PageHeader
        title="Portos"
        description="Gerenciamento de portos cadastrados"
        action={{ label: 'Novo porto', onClick: () => navigate('/ports/new') }}
      />

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : !ports?.length ? (
          <EmptyState />
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="table-header-cell">Nome</th>
                <th className="table-header-cell w-36">Ações</th>
              </tr>
            </thead>
            <tbody>
              {ports.map((port) => (
                <tr
                  key={port.id}
                  className="table-row cursor-pointer"
                  onDoubleClick={() => navigate(`/ports/${port.id}/edit`)}
                >
                  <td className="table-cell font-medium">{port.name}</td>
                  <td className="table-cell">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() => setToDelete(port)}
                    >
                      ×
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {toDelete && (
        <ConfirmModal
          title="Remover porto"
          description={`Remover o porto "${toDelete.name}"?`}
          onConfirm={handleDelete}
          onCancel={() => setToDelete(null)}
          loading={deletePort.isPending}
        />
      )}
    </div>
  )
}
