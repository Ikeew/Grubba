export interface Client {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClientSummary {
  id: string
  name: string
  cnpj: string | null
}

export interface ClientCreatePayload {
  name: string
  cnpj?: string
  email?: string
  phone?: string
  address?: string
  notes?: string
}

export interface ClientUpdatePayload extends Partial<ClientCreatePayload> {
  is_active?: boolean
}
