import { useQuery } from '@tanstack/react-query'
import { historyService } from '@/services/history.service'

export function useExportHistory(exportRecordId: string) {
  return useQuery({
    queryKey: ['history', 'export', exportRecordId],
    queryFn: () => historyService.listByExport(exportRecordId),
    enabled: !!exportRecordId,
  })
}

export function useImportHistory(importRecordId: string) {
  return useQuery({
    queryKey: ['history', 'import', importRecordId],
    queryFn: () => historyService.listByImport(importRecordId),
    enabled: !!importRecordId,
  })
}
