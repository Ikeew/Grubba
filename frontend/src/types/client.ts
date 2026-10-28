export interface Client {
  id: string
  name: string
  cnpj: string | null
  email: string | null
  phone: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  // Decimais chegam como string ("150.00")
  valor_padrao_importacao: string | null
  valor_padrao_exportacao: string | null
  valor_padrao_desconsolidacao: string | null
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
  // Só admin/manager podem enviar; null limpa o valor
  valor_padrao_importacao?: string | null
  valor_padrao_exportacao?: string | null
  valor_padrao_desconsolidacao?: string | null
}

export interface ClientUpdatePayload extends Partial<ClientCreatePayload> {
  is_active?: boolean
}
