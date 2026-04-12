import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useExport } from '@/hooks/useExports'
import { useExportNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { useExportHistory } from '@/hooks/useHistory'
import { useExportFiles, useUploadExportFile, useDeleteExportFile } from '@/hooks/useExportFiles'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate, formatDateTime, formatFileSize, formatFieldName } from '@/utils/format'
import { MAP_TYPE_LABELS } from '@/utils/constants'
import { EXPORT_SERVICE_LABELS, type ExportService } from '@/types/export'
import { useAuth } from '@/contexts/AuthContext'

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value || '—'}</dd>
    </div>
  )
}

export default function ExportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newNote, setNewNote] = useState('')

  const { user } = useAuth()
  const { data: record, isLoading } = useExport(id!)
  const { data: notes } = useExportNotes(id!)
  const { data: history } = useExportHistory(id!)
  const { data: files } = useExportFiles(id!)
  const uploadFile = useUploadExportFile(id!)
  const deleteFile = useDeleteExportFile(id!)
  const createNote = useCreateNote({ exportRecordId: id })
  const deleteNote = useDeleteNote({ exportRecordId: id })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile.mutateAsync(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function handlePrint() {
    window.print()
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    await createNote.mutateAsync({ content: newNote, export_record_id: id })
    setNewNote('')
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (!record) return <p className="text-slate-500">Ficha não encontrada.</p>

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={`Exportação — ${record.reference ?? record.id.slice(0, 8)}`}
        backTo="/exports"
        secondaryAction={{ label: 'Baixar PDF', onClick: handlePrint }}
        action={
          user?.role === 'admin' || record.collaborator?.id === user?.id
            ? { label: 'Editar', onClick: () => navigate(`/exports/${id}/edit`) }
            : undefined
        }
      />

      {/* Status bar */}
      <div className="flex items-center gap-4 bg-white border border-slate-200 rounded-lg px-5 py-3">
        <StatusBadge status={record.status} />
        <span className="text-sm text-slate-500">Cliente: <strong className="text-slate-800">{record.client.name}</strong></span>
        <span className="text-sm text-slate-500">Data: <strong className="text-slate-800">{formatDate(record.date)}</strong></span>
        {record.cargo_type && (
          <span className="text-sm text-slate-500">Tipo: <strong className="text-slate-800">{record.cargo_type}</strong></span>
        )}
        {record.collaborator && (
          <span className="text-sm text-slate-500">Colaborador: <strong className="text-slate-800">{record.collaborator.full_name}</strong></span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Logística */}
        <div className="form-section">
          <p className="form-section-title">Logística marítima</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="Navio" value={record.vessel} />
            <DetailRow label="Porto" value={record.port?.name ?? null} />
            <DetailRow label="Armador" value={record.shipping_company} />
            <DetailRow label="Booking" value={record.booking} />
            <DetailRow label="LPCO" value={record.lpco} />
            <DetailRow label="DUE 25BR" value={record.due_25br} />
            <DetailRow label="ETA" value={formatDate(record.eta)} />
            <DetailRow label="ETB" value={formatDate(record.etb)} />
            <DetailRow label="ET5" value={formatDate(record.et5)} />
            <DetailRow label="DDL Carga" value={formatDate(record.ddl_carga)} />
          </dl>
        </div>

        {/* Vistoria */}
        <div className="form-section">
          <p className="form-section-title">Vistoria e liberação</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="Tipo de mapa" value={record.map_type ? MAP_TYPE_LABELS[record.map_type] : null} />
            <DetailRow label="Unidade selecionada" value={record.selected_unit} />
            <DetailRow label="Novo lacre" value={record.new_seal} />
            <DetailRow label="Data da vistoria" value={formatDate(record.inspection_date)} />
            <DetailRow label="Comex liberado em" value={formatDate(record.comex_released_date)} />
            <DetailRow label="Finalizado em" value={formatDateTime(record.finalized_at)} />
          </dl>

          <div className="mt-4">
            <p className="text-xs font-medium text-slate-500 mb-2">Serviços</p>
            {record.services.length ? (
              <div className="flex flex-wrap gap-1.5">
                {record.services.map((s) => (
                  <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                    {EXPORT_SERVICE_LABELS[s as ExportService] ?? s}
                  </span>
                ))}
              </div>
            ) : <span className="text-sm text-slate-400">Nenhum serviço</span>}
          </div>
        </div>
      </div>

      {/* Observações */}
      {record.observations && (
        <div className="form-section">
          <p className="form-section-title">Observações</p>
          <p className="text-sm text-slate-700 whitespace-pre-wrap">{record.observations}</p>
        </div>
      )}

      {/* Arquivos */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-3">
          <p className="form-section-title !pb-0 !border-0">Arquivos anexados</p>
          <div className="no-print">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="secondary"
              loading={uploadFile.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              Anexar arquivo
            </Button>
          </div>
        </div>
        {files?.length ? (
          <div className="divide-y divide-slate-100">
            {files.map((file) => (
              <div key={file.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.original_filename}</p>
                  <p className="text-xs text-slate-400">
                    {formatFileSize(file.file_size)} · {formatDateTime(file.created_at)}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400"
                  onClick={() => deleteFile.mutate(file.id)}
                  loading={deleteFile.isPending}
                >
                  Remover
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">Nenhum arquivo anexado.</p>
        )}
      </div>

      {/* Notes */}
      <div className="form-section">
        <p className="form-section-title">Notas</p>
        <div className="space-y-3 mb-4">
          {notes?.length ? notes.map((note) => (
            <div key={note.id} className="bg-slate-50 rounded-lg p-3 flex justify-between items-start">
              <div>
                <p className="text-sm text-slate-800">{note.content}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {note.author?.full_name ?? 'Sistema'} · {formatDateTime(note.created_at)}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteNote.mutate(note.id)}>
                ×
              </Button>
            </div>
          )) : <p className="text-sm text-slate-400">Nenhuma nota registrada.</p>}
        </div>
        <div className="no-print flex gap-3">
          <Textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            placeholder="Nova nota..."
            rows={2}
            className="flex-1"
          />
          <Button onClick={handleAddNote} loading={createNote.isPending} className="self-end">
            Adicionar
          </Button>
        </div>
      </div>

      {/* History */}
      <div className="form-section">
        <p className="form-section-title">Histórico de alterações</p>
        {history?.length ? (
          <div className="divide-y divide-slate-100">
            {history.map((entry) => (
              <div key={entry.id} className="py-2.5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <span className="text-sm font-medium text-slate-700">{formatFieldName(entry.field_name)}</span>
                  <span className="text-sm text-slate-400 mx-2">→</span>
                  <span className="text-sm text-slate-900">{entry.new_value ?? '—'}</span>
                  {entry.old_value && (
                    <span className="text-xs text-slate-400 ml-2">(era: {entry.old_value})</span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-slate-500">{entry.changed_by?.full_name ?? '—'}</p>
                  <p className="text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : <p className="text-sm text-slate-400">Nenhuma alteração registrada.</p>}
      </div>
    </div>
  )
}
