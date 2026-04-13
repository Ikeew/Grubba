import type { ExportStatus, ImportStatus } from '@/types/common'

export const EXPORT_STATUS_LABELS: Record<ExportStatus, string> = {
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
}

export const EXPORT_STATUS_COLORS: Record<ExportStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  protocolado: 'bg-purple-100 text-purple-700',
  agendado_inspecao: 'bg-yellow-100 text-yellow-700',
  aguardando_certificado: 'bg-orange-100 text-orange-700',
  deferido: 'bg-teal-100 text-teal-700',
  embarcado_aguardando_documento: 'bg-cyan-100 text-cyan-700',
  aguardando_autorizacao_lacre: 'bg-pink-100 text-pink-700',
  aguardando_chegada_navio: 'bg-slate-100 text-slate-700',
  aguardando_mais_informacoes: 'bg-amber-100 text-amber-700',
}

export const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  in_progress: 'Em Andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  aguardando_chegada_navio: 'Aguardando Chegada do Navio',
  mapa_tfa: 'Mapa TFA',
  comex_solicitado: 'Comex Solicitado',
  faturamento_solicitado: 'Faturamento Solicitado',
  agendamento: 'Agendamento',
  aguardando_data_vistoria: 'Aguardando Data de Vistoria',
  aguardando_mais_informacoes: 'Aguardando Mais Informações',
  agendado_inspecao: 'Agendado Inspeção',
  aguardando_ati: 'Aguardando/ATI',
  aguardando_plmi_tela_verde: 'Aguardo PLMI/Tela Verde',
  aguardando_programacao: 'Aguardo Programação',
}

export const IMPORT_STATUS_COLORS: Record<ImportStatus, string> = {
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  aguardando_chegada_navio: 'bg-slate-100 text-slate-700',
  mapa_tfa: 'bg-purple-100 text-purple-700',
  comex_solicitado: 'bg-yellow-100 text-yellow-700',
  faturamento_solicitado: 'bg-orange-100 text-orange-700',
  agendamento: 'bg-teal-100 text-teal-700',
  aguardando_data_vistoria: 'bg-indigo-100 text-indigo-700',
  aguardando_mais_informacoes: 'bg-amber-100 text-amber-700',
  agendado_inspecao: 'bg-yellow-100 text-yellow-700',
  aguardando_ati: 'bg-cyan-100 text-cyan-700',
  aguardando_plmi_tela_verde: 'bg-green-100 text-green-700',
  aguardando_programacao: 'bg-violet-100 text-violet-700',
}

export const MAP_TYPE_LABELS = {
  vegetal: 'Vegetal',
  animal: 'Animal',
}

export const MODALITY_LABELS = {
  maritimo: 'Marítimo',
  aereo: 'Aéreo',
}

export const PAGE_SIZE = 20
