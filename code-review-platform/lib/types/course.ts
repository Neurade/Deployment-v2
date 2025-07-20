export interface Assignment {
  id: string
  name: string
  answerKey: File
}

export interface Course {
  id: string
  name: string
  githubToken: string
  githubUrl: string
  generalAnswer: File

  // autoGradingEnabled: boolean
  assignments: Assignment[]
  studentCount: number
  assignmentCount: number
  createdAt: string
}

export interface CreateCourseRequest {
  name: string
  githubToken: string
  githubUrl: string
  generalAnswer: File
  assignments: Omit<Assignment, "id">[]
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
  id: string
}
