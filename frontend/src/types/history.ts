import type { UserSummary } from './export'

export interface HistoryEntry {
  id: string
  record_type: 'export' | 'import_'
  export_record_id: string | null
  import_record_id: string | null
  field_name: string
  old_value: string | null
  new_value: string | null
  description: string | null
  changed_by: UserSummary | null
  created_at: string
}
