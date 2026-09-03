import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  useDeconsolidation,
  useDeconsolidationFiles,
  useUploadDeconsolidationFile,
  useDeleteDeconsolidationFile,
} from '@/hooks/useDeconsolidations'
import { useDeconsolidationNotes, useCreateNote, useDeleteNote } from '@/hooks/useNotes'
import { useDeconsolidationHistory } from '@/hooks/useHistory'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import {
  formatDate,
  formatDateTime,
  formatFileSize,
  formatFieldName,
  formatFieldValue,
} from '@/utils/format'
import { DECONSOLIDATION_MODALITY_LABELS } from '@/utils/constants'

function DetailRow({ label, value }: { label: string; value?: string | null | boolean }) {
  const display = typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : value
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 print-label">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900 print-value">{display || '—'}</dd>
    </div>
  )
}

export default function DeconsolidationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [newNote, setNewNote] = useState('')

  const { data: record, isLoading } = useDeconsolidation(id!)
  const { data: notes } = useDeconsolidationNotes(id!)
  const { data: history } = useDeconsolidationHistory(id!)
  const { data: files } = useDeconsolidationFiles(id!)
  const uploadFile = useUploadDeconsolidationFile(id!)
  const deleteFile = useDeleteDeconsolidationFile(id!)
  const createNote = useCreateNote({ deconsolidationRecordId: id })
  const deleteNote = useDeleteNote({ deconsolidationRecordId: id })

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    await uploadFile.mutateAsync(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleAddNote() {
    if (!newNote.trim()) return
    await createNote.mutateAsync({ content: newNote, deconsolidation_record_id: id })
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
        title={`Desconsolidação — ${record.reference ?? record.id.slice(0, 8)}`}
        backTo="/deconsolidations"
        secondaryAction={{ label: 'Baixar PDF', onClick: handlePrint }}
        action={{ label: 'Editar', onClick: () => navigate(`/deconsolidations/${id}/edit`) }}
      />

      {/* Status bar */}
      <div className="print-status-bar flex flex-wrap items-center gap-4 bg-white border border-slate-200 rounded-lg px-5 py-3">
        <StatusBadge status={record.status} />
        <span className="text-sm text-slate-500">Cliente: <strong className="text-slate-800">{record.client.name}</strong></span>
        {record.modality && (
          <span className="text-sm text-slate-500">
            Modalidade: <strong className="text-slate-800">{DECONSOLIDATION_MODALITY_LABELS[record.modality]}</strong>
          </span>
        )}
        <span className="text-sm text-slate-500">Data: <strong className="text-slate-800">{formatDate(record.date) || '—'}</strong></span>
        {record.collaborator && (
          <span className="text-sm text-slate-500">Responsável: <strong className="text-slate-800">{record.collaborator.full_name}</strong></span>
        )}
      </div>

      <div className="print-sections-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Documentação */}
        <div className="form-section">
          <p className="form-section-title">Documentação</p>
          <dl className="print-detail-grid print-field-grid grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="CE Mercante" value={record.ce_mercante} />
            <DetailRow label="AWB / BL Master" value={record.master_bl} />
            <DetailRow label="AWB / BL House" value={record.house_bl} />
            <DetailRow label="Consignatário" value={record.consignee} />
          </dl>
        </div>

        {/* Representação */}
        <div className="form-section">
          <p className="form-section-title">Representação</p>
          <dl className="print-detail-grid print-field-grid grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailRow label="Agência representante" value={record.agency} />
            <DetailRow label="Armador" value={record.shipping_company} />
            <DetailRow label="Concluído em" value={formatDateTime(record.completed_at)} />
            <DetailRow label="Faturado" value={record.billing_completed} />
          </dl>
        </div>
      </div>

      {/* Observações */}
      <div className="print-obs-section form-section">
        <p className="form-section-title">Observações</p>
        <div className="print-obs-box min-h-[60px] text-sm text-slate-700 whitespace-pre-wrap">
          {record.observations || <span className="text-slate-400">—</span>}
        </div>
      </div>

      {/* Arquivos */}
      <div className="form-section">
        <div className="flex items-center justify-between mb-3">
          <p className="form-section-title !pb-0 !border-0">Arquivos anexados</p>
          <div className="no-print">
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            <Button size="sm" variant="secondary" loading={uploadFile.isPending} onClick={() => fileInputRef.current?.click()}>
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
                  <p className="text-xs text-slate-400 no-print">
                    {formatFileSize(file.file_size)} · {formatDateTime(file.created_at)}
                  </p>
                </div>
                <Button size="sm" variant="ghost" className="text-red-400 no-print" onClick={() => deleteFile.mutate(file.id)} loading={deleteFile.isPending}>
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
      <div className="form-section print-hide">
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
      <div className="form-section print-hide">
        <p className="form-section-title">Histórico de alterações</p>
        {history?.length ? (
          <div className="divide-y divide-slate-100">
            {history.map((entry) => (
              <div key={entry.id} className="py-3 flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-700 mb-0.5">{formatFieldName(entry.field_name)}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    {entry.old_value ? (
                      <>
                        <span className="text-sm text-slate-400 line-through">{formatFieldValue(entry.field_name, entry.old_value)}</span>
                        <span className="text-slate-300">→</span>
                        <span className="text-sm text-slate-900 font-medium">{formatFieldValue(entry.field_name, entry.new_value)}</span>
                      </>
                    ) : (
                      <span className="text-sm text-slate-900 font-medium">{formatFieldValue(entry.field_name, entry.new_value)}</span>
                    )}
                  </div>
                  {entry.description && (
                    <p className="text-xs text-slate-500 mt-1 italic">{entry.description}</p>
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
