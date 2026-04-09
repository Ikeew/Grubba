import { z } from 'zod'

const EXPORT_STATUSES = [
  'in_progress', 'completed', 'cancelled',
  'protocolado', 'agendado_inspecao', 'aguardando_certificado',
  'deferido', 'embarcado_aguardando_documento', 'aguardando_autorizacao_lacre',
] as const

export const exportSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  reference: z.string().min(1, 'Referência obrigatória'),
  date: z.string().min(1, 'Data obrigatória'),
  status: z.enum(EXPORT_STATUSES).default('in_progress'),
  lpco: z.string().optional(),
  vessel: z.string().optional(),
  booking: z.string().optional(),
  port_id: z.string().optional(),
  due_25br: z.string().optional(),
  eta: z.string().optional(),
  ddl_carga: z.string().optional(),
  shipping_company: z.string().optional(),
  etb: z.string().optional(),
  et5: z.string().optional(),
  services: z.array(z.string()).default([]),
  map_type: z.union([z.enum(['vegetal', 'animal']), z.literal('')]).optional(),
  selected_unit: z.string().optional(),
  new_seal: z.string().optional(),
  inspection_date: z.string().optional(),
  comex_released_date: z.string().optional(),
  collaborator_id: z.string().optional(),
  finalized_at: z.string().optional(),
  observations: z.string().optional(),
})

export type ExportFormValues = z.infer<typeof exportSchema>
