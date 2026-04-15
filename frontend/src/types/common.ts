export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface ClientSummary {
  id: string
  name: string
  cnpj: string | null
}

export interface PortSummary {
  id: string
  name: string
}

export type ExportStatus =
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'protocolado'
  | 'agendado_inspecao'
  | 'aguardando_certificado'
  | 'deferido'
  | 'embarcado_aguardando_documento'
  | 'aguardando_autorizacao_lacre'
  | 'aguardando_chegada_navio'
  | 'aguardando_mais_informacoes'
  | 'aguardando_data_vistoria'

export type ImportStatus =
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'aguardando_chegada_navio'
  | 'mapa_tfa'
  | 'comex_solicitado'
  | 'faturamento_solicitado'
  | 'agendamento'
  | 'aguardando_data_vistoria'
  | 'aguardando_mais_informacoes'
  | 'agendado_inspecao'
  | 'aguardando_ati'
  | 'aguardando_plmi_tela_verde'
  | 'aguardando_programacao'

export type MapType = 'vegetal' | 'animal'
export type UserRole = 'admin' | 'collaborator'
