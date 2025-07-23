export interface Course {
  id: number
  user_id: number
  course_name: string
  github_url: string
  owner: string
  repo_name: string
  general_answer?: string
  auto_grade: boolean
  created_at: string
  updated_at: string
}

export interface CreateCourseRequest {
  course_name: string
  github_url: string
  general_answer?: string
  auto_grade: boolean
}

export interface UpdateCourseRequest {
  course_name?: string
  github_url?: string
  general_answer?: string
  auto_grade?: boolean
}
