import type { ClientSummary, RecordStatus, MapType } from './common'

export type ExportService =
  | 'vistoria_receita_federal'
  | 'coleta_e_entrega_de_lacre'
  | 'vistoria_mapa_coleta'
  | 'vistoria_anuentes'
  | 'comex'
  | 'liberacao_retirada_de_bl_e_docs'
  | 'fornecimento_de_navio_oleo'
  | 'mapa_sistema'
  | 'lpco_x_vistoria_x_cf_csi'
  | 'registro_despacho'
  | 'outros'

export const EXPORT_SERVICE_LABELS: Record<ExportService, string> = {
  vistoria_receita_federal: 'Vistoria Receita Federal',
  coleta_e_entrega_de_lacre: 'Coleta e Entrega de Lacre',
  vistoria_mapa_coleta: 'Vistoria Mapa Coleta',
  vistoria_anuentes: 'Vistoria Anuentes',
  comex: 'Comex',
  liberacao_retirada_de_bl_e_docs: 'Liberação/Retirada de BL e docs',
  fornecimento_de_navio_oleo: 'Fornecimento de navio/óleo',
  mapa_sistema: 'Mapa/Sistema',
  lpco_x_vistoria_x_cf_csi: 'LPCO X Vistoria x CF/CSI',
  registro_despacho: 'Registro Despacho',
  outros: 'Outros',
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
