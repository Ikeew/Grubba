import type { ClientSummary, RecordStatus, MapType } from './common'

export type ExportService =
  | 'scanner'
  | 'pesagem'
  | 'fotografia'
  | 'colocacao_de_lacre'
  | 'desunitizacao'
  | 'unitizacao'
  | 'posicionamento_receita_federal'
  | 'fornecimento_de_lacre'

export const EXPORT_SERVICE_LABELS: Record<ExportService, string> = {
  scanner: 'Scanner',
  pesagem: 'Pesagem',
  fotografia: 'Fotografia',
  colocacao_de_lacre: 'Colocação de Lacre',
  desunitizacao: 'Desunitização',
  unitizacao: 'Unitização',
  posicionamento_receita_federal: 'Posicionamento Receita Federal',
  fornecimento_de_lacre: 'Fornecimento de Lacre',
}

export interface UserSummary {
  id: string
  full_name: string
  email: string
  role: string
}

export interface ExportRecord {
  id: string
  reference: string | null
  date: string | null
  status: RecordStatus
  lpco: string | null
  vessel: string | null
  booking: string | null
  port: string | null
  due_25br: string | null
  eta: string | null
  ddl_carga: string | null
  shipping_company: string | null
  etb: string | null
  et5: string | null
  services: ExportService[]
  map_type: MapType | null
  selected_unit: string | null
  new_seal: string | null
  inspection_date: string | null
  comex_released_date: string | null
  finalized_at: string | null
  observations: string | null
  client: ClientSummary
  collaborator: UserSummary | null
  created_at: string
  updated_at: string
}

export interface ExportRecordPayload {
  client_id: string
  reference?: string
  date?: string
  status?: RecordStatus
  lpco?: string
  vessel?: string
  booking?: string
  port?: string
  due_25br?: string
  eta?: string
  ddl_carga?: string
  shipping_company?: string
  etb?: string
  et5?: string
  services?: ExportService[]
  map_type?: MapType
  selected_unit?: string
  new_seal?: string
  inspection_date?: string
  comex_released_date?: string
  collaborator_id?: string
  finalized_at?: string
  observations?: string
}
