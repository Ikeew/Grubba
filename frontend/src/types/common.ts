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

export type RecordStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled'
export type MapType = 'vegetal' | 'animal'
export type UserRole = 'admin' | 'collaborator'
