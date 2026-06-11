export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value + 'T00:00:00')
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR', { hour12: false })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatFieldName(field: string): string {
  const map: Record<string, string> = {
    // Comuns
    reference: 'Referência',
    date: 'Data',
    status: 'Status',
    vessel: 'Navio',
    port: 'Porto',
    eta: 'ETA',
    etb: 'ETB',
    shipping_company: 'Armador',
    collaborator_id: 'Colaborador',
    finalized_at: 'Finalizado em',
    observations: 'Observações',
    map_type: 'Tipo de Mapa',
    selected_unit: 'Unidade Selecionada',
    // Exportação
    lpco: 'LPCO',
    booking: 'Booking',
    services: 'Serviços',
    due_25br: '25BR Vencimento',
    ddl_carga: 'DDL Carga',
    et5: 'ET5',
    cargo_type: 'Tipo de Carga',
    new_seal: 'Novo Lacre',
    inspection_date: 'Data de Inspeção',
    comex_released_date: 'Data Liberação Comex',
    // Importação
    modality: 'Modalidade',
    importer: 'Importador',
    ce_mercante: 'CE Mercante',
    awb_bl: 'AWB/BL',
    di_duimp_dta: 'DI/DUIMP/DTA',
    numero_li: 'Número LI',
    dta: 'DTA',
    dtc: 'DTC',
    containers: 'Contêineres',
    carrier: 'Transportadora',
    local_ioa: 'Local IOA',
    lpco_packaging: 'LPCO Embalagem',
    lpco_number: 'Número LPCO',
    map_packaging_released: 'Mapa Embalagem Liberado',
    cargo_presence_date: 'Data Presença de Carga',
    released_at: 'Liberado em',
    comex_informed_date: 'Data Informação Comex',
    comex_released: 'Comex Liberado',
    guide_sent: 'Guia Enviada',
  }
  return map[field] ?? field
}

const EXPORT_SERVICE_LABELS: Record<string, string> = {
  vistoria_receita_federal: 'Vistoria Receita Federal',
  coleta_e_entrega_de_lacre: 'Coleta e Entrega de Lacre',
  vistoria_mapa_coleta: 'Vistoria MAPA/Coleta',
  vistoria_anuentes: 'Vistoria Anuentes',
  comex: 'Comex',
  liberacao_retirada_de_bl_e_docs: 'Liberação/Retirada de BL e Docs',
  fornecimento_de_navio_oleo: 'Fornecimento de Navio/Óleo',
  mapa_sistema: 'MAPA Sistema',
  lpco_x_vistoria_x_cf_csi: 'LPCO × Vistoria × CF/CSI',
  registro_despacho: 'Registro/Despacho',
  outros: 'Outros',
}

export function formatFieldValue(fieldName: string, value: string | null | undefined): string {
  if (value === null || value === undefined || value === 'None') return '—'

  // Booleanos
  if (value === 'True' || value === 'true') return 'Sim'
  if (value === 'False' || value === 'false') return 'Não'

  // Status de exportação
  const EXPORT_STATUS: Record<string, string> = {
    in_progress: 'Em Andamento',
    completed: 'Concluído',
    cancelled: 'Cancelado',
    protocolado: 'Protocolado',
    agendado_inspecao: 'Agendado Inspeção',
    aguardando_certificado: 'Aguardando Certificado',
    deferido: 'Deferido',
    embarcado_aguardando_documento: 'Embarcado/Aguardando Documento',
    aguardando_autorizacao_lacre: 'Aguardando Autorização/Lacre',
    aguardando_chegada_navio: 'Aguardando Chegada do Navio',
    aguardando_mais_informacoes: 'Aguardando Mais Informações',
    aguardando_data_vistoria: 'Aguardando Data de Vistoria',
  }

  // Status de importação
  const IMPORT_STATUS: Record<string, string> = {
    ...EXPORT_STATUS,
    mapa_tfa: 'Mapa TFA',
    comex_solicitado: 'Comex Solicitado',
    faturamento_solicitado: 'Faturamento Solicitado',
    agendamento: 'Agendamento',
    aguardando_ati: 'Aguardando/ATI',
    aguardando_plmi_tela_verde: 'Aguardo PLMI/Tela Verde',
    aguardando_programacao: 'Aguardo Programação',
    dsa_registrada: 'DSA Registrada',
  }

  if (fieldName === 'status') {
    return EXPORT_STATUS[value] ?? IMPORT_STATUS[value] ?? value
  }

  if (fieldName === 'map_type') {
    return value === 'vegetal' ? 'Vegetal' : value === 'animal' ? 'Animal' : value
  }

  if (fieldName === 'modality') {
    return value === 'maritimo' ? 'Marítimo' : value === 'aereo' ? 'Aéreo' : value
  }

  // Serviços: lista JSON → labels legíveis
  if (fieldName === 'services') {
    try {
      const parsed: unknown = JSON.parse(value.replace(/'/g, '"'))
      if (Array.isArray(parsed)) {
        if (parsed.length === 0) return '—'
        return parsed.map((s) => EXPORT_SERVICE_LABELS[s as string] ?? s).join(', ')
      }
    } catch {
      // não era JSON, cai no fallback
    }
    return value
  }

  // Campos de data (formato ISO YYYY-MM-DD)
  const dateFields = new Set([
    'date', 'eta', 'etb', 'finalized_at', 'inspection_date', 'comex_released_date',
    'cargo_presence_date', 'released_at', 'comex_informed_date', 'due_25br', 'ddl_carga', 'et5',
  ])
  if (dateFields.has(fieldName)) {
    const iso = value.length === 10 ? value + 'T00:00:00' : value
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return d.toLocaleDateString('pt-BR')
  }

  return value
}
