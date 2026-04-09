export interface Port {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export interface PortCreatePayload {
  name: string
}

export interface PortUpdatePayload {
  name?: string
}
