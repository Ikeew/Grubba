import { z } from 'zod'

import type { DeconsolidationStatus } from '@/types/common'

/** Mesmos valores que `DeconsolidationStatus` / API — manter alinhado ao backend */
const DECONSOLIDATION_STATUSES = [
  'aguardando_chegada_documento',
  'agendamento_apresentacao',
  'aguardando_liberacao',
  'liberacao_realizada',
  'completed',
  'cancelled',
] as const satisfies readonly DeconsolidationStatus[]

export const deconsolidationSchema = z.object({
  client_id: z.string().min(1, 'Cliente obrigatório'),
  reference: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(DECONSOLIDATION_STATUSES).default('aguardando_chegada_documento'),
  modality: z.union([z.enum(['importacao', 'exportacao']), z.literal('')]).optional(),
  consignee: z.string().optional(),
  ce_mercante: z.string().optional(),
  master_bl: z.string().optional(),
  house_bl: z.string().optional(),
  agency: z.string().optional(),
  shipping_company: z.string().optional(),
  collaborator_id: z.string().optional(),
  observations: z.string().optional(),
})

export type DeconsolidationFormValues = z.infer<typeof deconsolidationSchema>
