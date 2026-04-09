import { z } from 'zod'

const IMPORT_STATUSES = [
  'in_progress', 'completed', 'cancelled',
  'aguardando_chegada_navio', 'mapa_tfa', 'comex_solicitado',
  'faturamento_solicitado', 'agendamento',
] as const

export const importSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  reference: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(IMPORT_STATUSES).default('in_progress'),
  modality: z.union([z.enum(['maritimo', 'aereo']), z.literal('')]).optional(),
  importer: z.string().optional(),
  ce_mercante: z.string().optional(),
  awb_bl: z.string().optional(),
  di_duimp_dta: z.string().optional(),
  numero_li: z.string().optional(),
  dta: z.string().optional(),
  dtc: z.string().optional(),
  shipping_company: z.string().optional(),
  vessel: z.string().optional(),
  port_id: z.string().optional(),
  eta: z.string().optional(),
  etb: z.string().optional(),
  containers: z.string().optional(),
  carrier: z.string().optional(),
  local_ioa: z.string().optional(),
  lpco_packaging: z.string().optional(),
  lpco_number: z.string().optional(),
  map_type: z.union([z.enum(['vegetal', 'animal']), z.literal('')]).optional(),
  map_packaging_released: z.boolean().default(false),
  selected_unit: z.string().optional(),
  inspection_date: z.string().optional(),
  cargo_presence_date: z.string().optional(),
  released_at: z.string().optional(),
  comex_informed_date: z.string().optional(),
  comex_released: z.boolean().default(false),
  guide_sent: z.boolean().default(false),
  finalized_at: z.string().optional(),
  collaborator_id: z.string().optional(),
  observations: z.string().optional(),
})

export type ImportFormValues = z.infer<typeof importSchema>
