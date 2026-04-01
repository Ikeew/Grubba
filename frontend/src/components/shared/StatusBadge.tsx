import { Badge } from '@/components/ui/Badge'
import { STATUS_COLORS, STATUS_LABELS } from '@/utils/constants'
import type { RecordStatus } from '@/types/common'

export function StatusBadge({ status }: { status: RecordStatus }) {
  return <Badge label={STATUS_LABELS[status]} className={STATUS_COLORS[status]} />
}
