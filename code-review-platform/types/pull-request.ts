export interface PullRequest {
  id: number
  course_id: number
  assignment_id?: number
  pr_name: string
  pr_description: string
  status: string
  pr_number: number
  result?: any
  status_grade: string
  created_at: string
  updated_at: string
  // ...other fields as needed
}

export interface PullRequestResult {
  id: number
  pr_id: number
  summary: string
  score?: number
  comments: PullRequestComment[]
  created_at: string
  updated_at: string
}

export interface PullRequestComment {
  id: number
  position: number
  body: string
  // thiếu `path: string`
  path: string
}

export interface CreatePullRequestRequest {
  course_id: number
  pr_number: number
  title: string
  description: string
  author: string
  repository_url: string
  branch_name: string
}

export interface UpdateResultRequest {
  summary: string
  comments: Omit<PullRequestComment, 'id'>[]
}

export interface ReviewRequest {
  summary: string
  comments: Omit<PullRequestComment, 'id'>[]
}

export interface CommentorResponse {
  path: string
  position: number
  body: string
  code_comment_on: string
}

export interface ReviewResponse {
  summary: string
  comments: CommentorResponse[]
  input_tokens?: number
  output_tokens?: number
}