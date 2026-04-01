export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    reference: 'Referência',
    status: 'Status',
    vessel: 'Navio',
    port: 'Porto',
    eta: 'ETA',
    etb: 'ETB',
    shipping_company: 'Armador',
    collaborator_id: 'Colaborador',
    finalized_at: 'Finalizado em',
    observations: 'Observações',
    services: 'Serviços',
    map_type: 'Tipo de Mapa',
    lpco: 'LPCO',
    booking: 'Booking',
    modality: 'Modalidade',
    importer: 'Importador',
    ce_mercante: 'CE Mercante',
    comex_released: 'Comex Liberado',
    guide_sent: 'Guia Enviada',
  }
  return map[field] ?? field
}
