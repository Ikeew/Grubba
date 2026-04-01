import { z } from 'zod'

export const exportSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  reference: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'cancelled']).default('draft'),
  lpco: z.string().optional(),
  vessel: z.string().optional(),
  booking: z.string().optional(),
  port: z.string().optional(),
  due_25br: z.string().optional(),
  eta: z.string().optional(),
  ddl_carga: z.string().optional(),
  shipping_company: z.string().optional(),
  etb: z.string().optional(),
  et5: z.string().optional(),
  services: z.array(z.string()).default([]),
  map_type: z.enum(['vegetal', 'animal']).optional().or(z.literal('')),
  selected_unit: z.string().optional(),
  new_seal: z.string().optional(),
  inspection_date: z.string().optional(),
  comex_released_date: z.string().optional(),
  collaborator_id: z.string().optional(),
  finalized_at: z.string().optional(),
  observations: z.string().optional(),
})

export type ExportFormValues = z.infer<typeof exportSchema>
