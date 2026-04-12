import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useImport } from '@/hooks/useImports'
import { useImportNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { useImportHistory } from '@/hooks/useHistory'
import { useFiles, useUploadFile, useDeleteFile } from '@/hooks/useFiles'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { formatDate, formatDateTime, formatFileSize, formatFieldName } from '@/utils/format'
import { MAP_TYPE_LABELS, MODALITY_LABELS } from '@/utils/constants'

function DetailRow({ label, value }: { label: string; value?: string | null | boolean }) {
  const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{display || '—'}</dd>
    </div>
  )
}

export default function ImportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newNote, setNewNote] = useState('')

  const { user } = useAuth()
  const { data: record, isLoading } = useImport(id!)
  const { data: notes } = useImportNotes(id!)
  const { data: history } = useImportHistory(id!)
  const { data: files } = useFiles(id!)
  const uploadFile = useUploadFile(id!)
  const deleteFile = useDeleteFile(id!)
  const createNote = useCreateNote({ importRecordId: id })
  const deleteNote = useDeleteNote({ importRecordId: id })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile.mutateAsync(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    await createNote.mutateAsync({ content: newNote, import_record_id: id })
    setNewNote('')
  }

  function handlePrint() {
    window.print()
  }

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>
  if (!record) return <p className="text-slate-500">Ficha não encontrada.</p>

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={`Importação — ${record.reference ?? record.id.slice(0, 8)}`}
        backTo="/imports"
        secondaryAction={{ label: 'Baixar PDF', onClick: handlePrint }}
        action={
          user?.role === 'admin' || record.collaborator?.id === user?.id
            ? { label: 'Editar', onClick: () => navigate(`/imports/${id}/edit`) }
            : undefined
        }
      />

      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-lg px-5 py-3">
        <StatusBadge status={record.status} />
        <span className="text-sm text-slate-500">Cliente: <strong className="text-slate-800">{record.client.name}</strong></span>
        {record.modality && (
          <span className="text-sm text-slate-500">Modalidade: <strong className="text-slate-800">{MODALITY_LABELS[record.modality]}</strong></span>
        )}
        {record.cargo_type && (
          <span className="text-sm text-slate-500">Tipo: <strong className="text-slate-800">{record.cargo_type}</strong></span>
        )}
        {record.collaborator && (
          <span className="text-sm text-slate-500">Colaborador: <strong className="text-slate-800">{record.collaborator.full_name}</strong></span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentação */}
        <div className="form-section">
          <p className="form-section-title">Documentação</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="CE Mercante" value={record.ce_mercante} />
            <DetailRow label="AWB / BL" value={record.awb_bl} />
            <DetailRow label="DI / DUIMP / DTA" value={record.di_duimp_dta} />
            <DetailRow label="Número LI" value={record.numero_li} />
            <DetailRow label="DTA" value={record.dta} />
            <DetailRow label="DTC" value={record.dtc} />
            <DetailRow label="Importador" value={record.importer} />
          </dl>
        </div>

        {/* Logística */}
        <div className="form-section">
          <p className="form-section-title">Logística</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="Navio" value={record.vessel} />
            <DetailRow label="Porto" value={record.port?.name ?? null} />
            <DetailRow label="Armador" value={record.shipping_company} />
            <DetailRow label="ETA" value={formatDate(record.eta)} />
            <DetailRow label="ETB" value={formatDate(record.etb)} />
            <div className="col-span-2">
              <DetailRow label="Containers" value={record.containers} />
            </div>
            <div className="col-span-2">
              <DetailRow label="Local" value={record.local_ioa} />
            </div>
          </dl>
        </div>

        {/* LPCO / Mapa */}
        <div className="form-section">
          <p className="form-section-title">LPCO e Mapa</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="LPCO Embalagem" value={record.lpco_packaging} />
            <DetailRow label="Número LPCO" value={record.lpco_number} />
            <DetailRow label="Tipo de mapa" value={record.map_type ? MAP_TYPE_LABELS[record.map_type] : null} />
            <DetailRow label="Unidade selecionada" value={record.selected_unit} />
            <DetailRow label="Data de vistoria" value={formatDate(record.inspection_date)} />
            <DetailRow label="Mapa embalagem liberado" value={record.map_packaging_released} />
          </dl>
        </div>

        {/* Liberação */}
        <div className="form-section">
          <p className="form-section-title">Liberação</p>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="Presença da carga" value={formatDate(record.cargo_presence_date)} />
            <DetailRow label="Liberado em" value={formatDate(record.released_at)} />
            <DetailRow label="Comex informado" value={formatDate(record.comex_informed_date)} />
            <DetailRow label="Comex liberado" value={record.comex_released} />
            <DetailRow label="Guia enviada" value={record.guide_sent} />
            <DetailRow label="Finalizado em" value={formatDateTime(record.finalized_at)} />
          </dl>
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

      {/* Notas */}
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
              <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteNote.mutate(note.id)}>×</Button>
            </div>
          )) : <p className="text-sm text-slate-400">Nenhuma nota registrada.</p>}
        </div>
        <div className="no-print flex gap-3">
          <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Nova nota..." rows={2} className="flex-1" />
          <Button onClick={handleAddNote} loading={createNote.isPending} className="self-end">Adicionar</Button>
        </div>
      </div>

      {/* Histórico */}
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
                  {entry.old_value && <span className="text-xs text-slate-400 ml-2">(era: {entry.old_value})</span>}
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
