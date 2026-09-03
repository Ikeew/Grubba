import type { ClientSummary, DeconsolidationStatus, RecordFlag } from './common'
import type { UserSummary } from './export'

export type DeconsolidationModality = 'importacao' | 'exportacao'

export interface DeconsolidationRecord {
  id: string
  reference: string | null
  date: string | null
  status: DeconsolidationStatus
  modality: DeconsolidationModality | null
  consignee: string | null
  ce_mercante: string | null
  master_bl: string | null
  house_bl: string | null
  agency: string | null
  shipping_company: string | null
  observations: string | null
  completed_at: string | null
  billing_completed: boolean
  flags: RecordFlag[]
  client: ClientSummary
  collaborator: UserSummary | null
  created_at: string
  updated_at: string
}

export interface DeconsolidationRecordPayload {
  client_id: string
  reference?: string
  date?: string
  status?: DeconsolidationStatus
  modality?: DeconsolidationModality
  consignee?: string
  ce_mercante?: string
  master_bl?: string
  house_bl?: string
  agency?: string
  shipping_company?: string
  collaborator_id?: string
  observations?: string
}

export interface DeconsolidationFile {
  id: string
  deconsolidation_record_id: string
  original_filename: string
  stored_filename: string
  file_size: number
  content_type: string | null
  uploaded_by_id: string | null
  created_at: string
}
