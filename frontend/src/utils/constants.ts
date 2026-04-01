import type { RecordStatus } from '@/types/common'

export const STATUS_LABELS: Record<RecordStatus, string> = {
  draft: 'Rascunho',
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

export const STATUS_COLORS: Record<RecordStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export const MAP_TYPE_LABELS = {
  vegetal: 'Vegetal',
  animal: 'Animal',
}

export const MODALITY_LABELS = {
  maritimo: 'Marítimo',
  aereo: 'Aéreo',
}

export const PAGE_SIZE = 20
