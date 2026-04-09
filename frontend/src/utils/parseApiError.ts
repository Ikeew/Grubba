import axios from 'axios'

export function parseApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail.length > 0) {
      return detail.map((e: { msg?: string }) => e.msg ?? String(e)).join('; ')
    }
    if (error.response?.status === 422) return 'Dados inválidos. Verifique os campos e tente novamente.'
    if (error.response?.status === 409) return 'Registro duplicado.'
    if (error.response?.status === 404) return 'Recurso não encontrado.'
    if (error.response?.status && error.response.status >= 500) return 'Erro interno no servidor. Tente novamente.'
    return error.message
  }
  return 'Erro inesperado. Tente novamente.'
}
