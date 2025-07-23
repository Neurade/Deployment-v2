import { Assignment, CreateAssignmentRequest } from "@/types/assignment" // <-- Add CreateAssignmentRequest import
import apiClient from "@/lib/axios"

export const assignmentService = {
  async getAssignments(courseId: number): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>(`/assignments/course/${courseId}`)
    return response.data
  },

  async getAssignment(assignmentId: number): Promise<Assignment> {
    const response = await apiClient.get<Assignment>(`/assignments/${assignmentId}`)
    console.log(response.data)
    return response.data
  },

  async createAssignment(assignmentData: CreateAssignmentRequest | FormData): Promise<Assignment> {
    if (assignmentData instanceof FormData) {
      const response = await apiClient.post<Assignment>("/assignments", assignmentData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      return response.data
    } else {
      const response = await apiClient.post<Assignment>("/assignments", assignmentData)
      return response.data
    }
  },

  async deleteAssignment(assignmentId: number): Promise<void> {
    await apiClient.delete(`/assignments/${assignmentId}`)
  },

  async uploadAssignmentFile(assignmentId: number, file: File): Promise<void> {
    const formData = new FormData()
    formData.append("file", file)
    await apiClient.post(`/assignments/${assignmentId}/upload`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
  },

  async getAssignmentsByCourse(courseId: number): Promise<Assignment[]> {
    const response = await apiClient.get<Assignment[]>(`/assignments/course/${courseId}`)
    return response.data
  },
}
