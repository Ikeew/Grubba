export interface ImportFile {
  id: string
  import_record_id: string
  original_filename: string
  stored_filename: string
  file_size: number
  content_type: string | null
  uploaded_by_id: string | null
  created_at: string
}

export interface ExportFile {
  id: string
  export_record_id: string
  original_filename: string
  stored_filename: string
  file_size: number
  content_type: string | null
  uploaded_by_id: string | null
  created_at: string
}
