export interface Assignment {
  id: number
  course_id: number
  assignment_name: string
  description?: string
  assignment_url?: string
  created_at: string
  updated_at: string
}

export interface CreateAssignmentRequest {
  course_id: number
  assignment_name: string
  description?: string
  assignment_file?: File
}
