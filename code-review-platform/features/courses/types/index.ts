export interface Assignment {
  id: number
  course_id: number
  assignment_name: string
  description: string
  assignment_url: string
  created_at: string
  updated_at: string
}

export interface Course {
  id: number
  user_id: number
  course_name: string
  github_url: string
  general_answer: string
  auto_grade: boolean
  assignments: Assignment[]
  pull_requests: PullRequest[]
  student_count: number
  assignment_count: number
  created_at: string
  updated_at: string
}

export interface CourseCreateRequest {
  user_id: number
  course_name: string
  github_url: string
  general_answer: File
  auto_grade: boolean
}

export interface AssignmentCreateRequest {
  course_id: number
  assignment_name: string
  description: string
  assignment_file: File
}

export interface PullRequest {
  id: number
  course_id: number
  assignment_id: number
  pr_name: string
  pr_description: string
  status: string
  pr_number: number
  created_at: string
  updated_at: string
}

export interface PrCreateRequest {
  course_id: number
  assignment_id: number
  pr_name: string
  pr_description: string
  status: string
  pr_number: number
}

export interface CourseState {
  courses: Course[]
  currentCourse: Course | null
  assignments: Assignment[]
  pullRequests: PullRequest[]
  loading: boolean
  error: string | null
} 

export interface PullRequestState {
  currentCourse: Course | null
  pullRequests: PullRequest[]
  currentPullRequest: PullRequest[] | null
  // assignments: Assignment[] | null
  currentAssignment: Assignment | null
  loading: boolean
  error: string | null
}