import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { receiptService, type ReceiptListParams } from '@/services/receipt.service'
import type { ReceiptCreatePayload } from '@/types/receipt'
import { EXPORT_KEYS } from './useExports'
import { IMPORT_KEYS } from './useImports'
import { DECONSOLIDATION_KEYS } from './useDeconsolidations'

export const RECEIPT_KEYS = {
  all: ['receipts'] as const,
  list: (params: object) => ['receipts', 'list', params] as const,
  detail: (id: string) => ['receipts', id] as const,
  available: (clientId: string) => ['receipts', 'available', clientId] as const,
}

export function useAvailableRecords(clientId: string) {
  return useQuery({
    queryKey: RECEIPT_KEYS.available(clientId),
    queryFn: () => receiptService.availableRecords(clientId),
    enabled: !!clientId,
  })
}

export function useReceiptList(params: ReceiptListParams = {}) {
  return useQuery({
    queryKey: RECEIPT_KEYS.list(params),
    queryFn: () => receiptService.list(params),
  })
}

/** Gerar/cancelar recibo muda o selo "Recibo gerado" nas listas de fichas. */
function useInvalidateReceiptsAndRecords() {
  const qc = useQueryClient()
  return () => {
    qc.invalidateQueries({ queryKey: RECEIPT_KEYS.all })
    qc.invalidateQueries({ queryKey: EXPORT_KEYS.all })
    qc.invalidateQueries({ queryKey: IMPORT_KEYS.all })
    qc.invalidateQueries({ queryKey: DECONSOLIDATION_KEYS.all })
  }
}

export function useCreateReceipt() {
  const invalidate = useInvalidateReceiptsAndRecords()
  return useMutation({
    mutationFn: (payload: ReceiptCreatePayload) => receiptService.create(payload),
    onSuccess: invalidate,
  })
}

export function useCancelReceipt() {
  const invalidate = useInvalidateReceiptsAndRecords()
  return useMutation({
    mutationFn: (id: string) => receiptService.cancel(id),
    onSuccess: invalidate,
  })
}

export function useDownloadReceiptPdf() {
  return useMutation({
    mutationFn: ({ id, number }: { id: string; number: string }) => receiptService.downloadPdf(id, number),
  })
}
