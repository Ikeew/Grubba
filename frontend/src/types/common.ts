export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export type RecordStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled'
export type MapType = 'vegetal' | 'animal'
export type UserRole = 'admin' | 'collaborator'
