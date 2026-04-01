import type { UserSummary } from './export'

export interface Note {
  id: string
  content: string
  export_record_id: string | null
  import_record_id: string | null
  author: UserSummary | null
  created_at: string
  updated_at: string
}

export interface NotePayload {
  content: string
  export_record_id?: string
  import_record_id?: string
}
