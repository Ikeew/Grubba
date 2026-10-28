import { z } from 'zod'

// Valor monetário opcional digitado no input numérico ('' = sem valor padrão)
const money = z
  .string()
  .optional()
  .refine((v) => !v || (/^\d+([.,]\d{1,2})?$/.test(v)), 'Valor inválido (ex.: 150,00)')

export const clientSchema = z.object({
  name: z.string().min(1, 'Nome obrigatório'),
  cnpj: z.string().optional(),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
  valor_padrao_importacao: money,
  valor_padrao_exportacao: money,
  valor_padrao_desconsolidacao: money,
})

export type ClientFormValues = z.infer<typeof clientSchema>
