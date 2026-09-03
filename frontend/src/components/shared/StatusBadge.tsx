import { Badge } from '@/components/ui/Badge'
import {
  DECONSOLIDATION_STATUS_COLORS, DECONSOLIDATION_STATUS_LABELS,
  EXPORT_STATUS_COLORS, EXPORT_STATUS_LABELS,
  IMPORT_STATUS_COLORS, IMPORT_STATUS_LABELS,
} from '@/utils/constants'
import type { DeconsolidationStatus, ExportStatus, ImportStatus } from '@/types/common'

type AnyStatus = ExportStatus | ImportStatus | DeconsolidationStatus

function getLabel(status: AnyStatus): string {
  if (status in EXPORT_STATUS_LABELS) return EXPORT_STATUS_LABELS[status as ExportStatus]
  if (status in IMPORT_STATUS_LABELS) return IMPORT_STATUS_LABELS[status as ImportStatus]
  if (status in DECONSOLIDATION_STATUS_LABELS)
    return DECONSOLIDATION_STATUS_LABELS[status as DeconsolidationStatus]
  return status
}

function getColor(status: AnyStatus): string {
  if (status in EXPORT_STATUS_COLORS) return EXPORT_STATUS_COLORS[status as ExportStatus]
  if (status in IMPORT_STATUS_COLORS) return IMPORT_STATUS_COLORS[status as ImportStatus]
  if (status in DECONSOLIDATION_STATUS_COLORS)
    return DECONSOLIDATION_STATUS_COLORS[status as DeconsolidationStatus]
  return 'bg-slate-100 text-slate-700'
}

export function StatusBadge({ status }: { status: AnyStatus }) {
  return <Badge label={getLabel(status)} className={getColor(status)} />
}
