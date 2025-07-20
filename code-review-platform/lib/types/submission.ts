export interface Submission {
  id: string
  courseId: string
  studentUsername: string
  studentEmail: string
  prId: string
  assignmentName: string
  score: number
  maxScore: number
  status: "graded" | "pending" | "failed"
  submittedAt: string
  gradedAt?: string
}

export interface SubmissionStats {
  total: number
  graded: number
  pending: number
  failed: number
  averageScore: number
}
