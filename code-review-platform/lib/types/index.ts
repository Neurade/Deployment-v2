// Re-export all types for easier imports
export * from "./auth"
export * from "./submission"
export * from "./course"

// Additional types for the platform
export interface PullRequestWithStatus {
  id: string
  prNumber: number
  prName: string
  prDescription: string
  status: "open" | "merged" | "closed" | "draft"
  gradingStatus: "graded" | "pending" | "failed" | "not_graded"
  assignmentId?: string
  author: string
  authorAvatar?: string
  courseId: string
  branch: string
  commits: number
  additions: number
  deletions: number
  createdAt: string
  updatedAt: string
  score?: number
  maxScore?: number
  feedback?: string
}

export interface AssignmentWithFile {
  id: string
  name: string
  description: string
  answerKey: {
    url: string
    fileName: string
    expiresIn: string
  }
  courseId: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  maxScore: number
  instructions?: string
  isActive: boolean
}

export interface CourseDetailWithFiles {
  id: string
  name: string
  description?: string
  githubUrl: string
  githubToken: string
  generalAnswer: {
    url: string
    fileName: string
    expiresIn: string
  }
  assignments: AssignmentWithFile[]
  studentsCount: number
  assignmentsCount: number
  instructor: {
    id: string
    name: string
    email: string
  }
  createdAt: string
  updatedAt: string
}
