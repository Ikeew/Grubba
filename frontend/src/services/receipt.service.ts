import { api } from '@/lib/axios'
import type { PaginatedResponse } from '@/types/common'
import type {
  AvailableRecordsResponse,
  Receipt,
  ReceiptCreatePayload,
  ReceiptListItem,
} from '@/types/receipt'

export interface ReceiptListParams {
  page?: number
  page_size?: number
  client_id?: string
  include_cancelled?: boolean
  search?: string
}

export const receiptService = {
  async availableRecords(clientId: string): Promise<AvailableRecordsResponse> {
    const { data } = await api.get<AvailableRecordsResponse>('/receipts/available-records', {
      params: { client_id: clientId },
    })
    return data
  },

  async list(params: ReceiptListParams = {}): Promise<PaginatedResponse<ReceiptListItem>> {
    const { data } = await api.get<PaginatedResponse<ReceiptListItem>>('/receipts', { params })
    return data
  },

  async getById(id: string): Promise<Receipt> {
    const { data } = await api.get<Receipt>(`/receipts/${id}`)
    return data
  },

  async create(payload: ReceiptCreatePayload): Promise<Receipt> {
    const { data } = await api.post<Receipt>('/receipts', payload)
    return data
  },

  async cancel(id: string): Promise<void> {
    await api.delete(`/receipts/${id}`)
  },

  /** Baixa o PDF (a rota exige o Bearer token, então não dá para usar um <a href> direto). */
  async downloadPdf(id: string, number: string): Promise<void> {
    const { data } = await api.get<Blob>(`/receipts/${id}/pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(data)
    const link = document.createElement('a')
    link.href = url
    link.download = `recibo-${number}.pdf`
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  },
}
