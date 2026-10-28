export type ReceiptRecordType = 'import' | 'export' | 'deconsolidation'

export interface FieldOption {
  key: string
  label: string
}

export interface ReceiptClientInfo {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  address: string | null
}

export interface AvailableRecord {
  record_type: ReceiptRecordType
  id: string
  reference: string | null
  date: string | null
  completed_at: string | null
  description: string | null
  /** Valor padrão do cliente para o tipo; null = em branco */
  suggested_amount: string | null
}

export interface AvailableRecordsResponse {
  client: ReceiptClientInfo
  records: AvailableRecord[]
  record_field_options: Record<ReceiptRecordType, FieldOption[]>
  client_field_options: FieldOption[]
  default_record_fields: Record<ReceiptRecordType, string[]>
  default_client_fields: string[]
}

export interface ReceiptCreatePayload {
  client_id: string
  issue_date?: string
  client_cnpj: string | null
  client_email: string | null
  client_fields: string[]
  record_fields: Partial<Record<ReceiptRecordType, string[]>>
  items: { record_type: ReceiptRecordType; record_id: string; amount: string | null }[]
  extra_costs: { description: string; amount: string }[]
}

export interface SnapshotField {
  key: string
  label: string
  value: string
}

interface UserName {
  id: string
  full_name: string
}

export interface Receipt {
  id: string
  number: string
  client_id: string
  issue_date: string
  subtotal: string
  extras_total: string
  total: string
  client_name: string
  client_cnpj: string | null
  client_email: string | null
  client_fields: string[]
  client_snapshot: SnapshotField[]
  record_fields: Record<string, string[]>
  items: {
    id: string
    record_type: ReceiptRecordType
    record_id: string | null
    reference: string | null
    amount: string
    snapshot: SnapshotField[]
  }[]
  extra_costs: { id: string; description: string; amount: string }[]
  is_cancelled: boolean
  cancelled_at: string | null
  created_by: UserName | null
  cancelled_by: UserName | null
  created_at: string
}

export interface ReceiptListItem {
  id: string
  number: string
  client_id: string
  client_name: string
  issue_date: string
  total: string
  items_count: number
  is_cancelled: boolean
  created_by: UserName | null
  created_at: string
}
