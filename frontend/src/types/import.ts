import type { ClientSummary, ImportStatus, MapType, PortSummary } from './common'
import type { UserSummary } from './export'

export type Modality = 'maritimo' | 'aereo'

export interface ImportRecord {
  id: string
  reference: string | null
  date: string | null
  status: ImportStatus
  modality: Modality | null
  importer: string | null
  ce_mercante: string | null
  awb_bl: string | null
  di_duimp_dta: string | null
  numero_li: string | null
  dta: string | null
  dtc: string | null
  shipping_company: string | null
  vessel: string | null
  port_id: string | null
  port: PortSummary | null
  eta: string | null
  etb: string | null
  containers: string | null
  carrier: string | null
  local_ioa: string | null
  lpco_packaging: string | null
  lpco_number: string | null
  map_type: MapType | null
  map_packaging_released: boolean
  selected_unit: string | null
  inspection_date: string | null
  cargo_presence_date: string | null
  released_at: string | null
  comex_informed_date: string | null
  comex_released: boolean
  guide_sent: boolean
  finalized_at: string | null
  observations: string | null
  flagged_by_ids: string[]
  client: ClientSummary
  collaborator: UserSummary | null
  created_at: string
  updated_at: string
}

export interface ImportRecordPayload {
  client_id: string
  reference?: string
  date?: string
  status?: ImportStatus
  modality?: Modality
  importer?: string
  ce_mercante?: string
  awb_bl?: string
  di_duimp_dta?: string
  numero_li?: string
  dta?: string
  dtc?: string
  shipping_company?: string
  vessel?: string
  port_id?: string
  eta?: string
  etb?: string
  containers?: string
  carrier?: string
  local_ioa?: string
  lpco_packaging?: string
  lpco_number?: string
  map_type?: MapType
  map_packaging_released?: boolean
  selected_unit?: string
  inspection_date?: string
  cargo_presence_date?: string
  released_at?: string
  comex_informed_date?: string
  comex_released?: boolean
  guide_sent?: boolean
  finalized_at?: string
  collaborator_id?: string
  observations?: string
}
