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

export type ImportStatus =
  | 'in_progress'
  | 'completed'
  | 'cancelled'
  | 'aguardando_chegada_navio'
  | 'mapa_tfa'
  | 'comex_solicitado'
  | 'faturamento_solicitado'
  | 'agendamento'

export type MapType = 'vegetal' | 'animal'
export type UserRole = 'admin' | 'collaborator'
