import apiClient from "@/lib/axios"
import { objectToFormData } from "@/lib/utils"
import type { 
  Course, 
  CourseCreateRequest, 
  Assignment, 
  AssignmentCreateRequest,
  PullRequest,
  PrCreateRequest 
} from "../types"

export class CourseService {
  static async getCourses(userId: number): Promise<Course[]> {
    try {
      const response = await apiClient.get<Course[]>(`/courses/owner/${userId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch courses")
    }
  }

  static async getCourse(courseId: number): Promise<Course> {
    try {
      const response = await apiClient.get<Course>(`/courses/${courseId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch course")
    }
  }

  static async createCourse(courseData: CourseCreateRequest): Promise<Course> {
    try {
      const formData = objectToFormData(courseData)
      
      const response = await apiClient.post<Course>("/courses", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create course")
    }
  }

  static async updateCourse(courseId: number, courseData: Partial<CourseCreateRequest>): Promise<Course> {
    try {
      const formData = objectToFormData(courseData)
      
      const response = await apiClient.put<Course>(`/courses/${courseId}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update course")
    }
  }

  static async deleteCourse(courseId: number): Promise<void> {
    try {
      await apiClient.delete(`/courses/${courseId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete course")
    }
  }

  static async getAssignments(courseId: number): Promise<Assignment[]> {
    try {
      const response = await apiClient.get<Assignment[]>(`/assignments/course/${courseId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch assignments")
    }
  }

   static async deleteAssignment(assignmentId: number): Promise<void> {
    try {
      await apiClient.delete(`/assignments/${assignmentId}`)
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to delete assignment")
    }
  }



  static async getAssignment(assignmentId: number): Promise<Assignment> {
    try {
      const response = await apiClient.get<Assignment>(`/assignments/${assignmentId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch assignments")
    }
  }

  static async createAssignment(assignmentData: AssignmentCreateRequest): Promise<Assignment> {
    try {
      const formData = objectToFormData(assignmentData)

      const response = await apiClient.post<Assignment>("assignments", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create assignment")
    }
  }

  static async getPullRequests(courseId: number): Promise<PullRequest[]> {
    try {
      const response = await apiClient.get<PullRequest[]>(`/pull-requests/course/${courseId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch pull requests")
    }
  }

  static async getPullRequest(pullRequestId: number): Promise<PullRequest[]> {
    try {
      const response = await apiClient.get<PullRequest[]>(`/pull-requests/${pullRequestId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch pull requests")
    }
  }

  static async createPullRequest(prData: PrCreateRequest): Promise<PullRequest> {
    try {
      const formData = objectToFormData(prData)

      const response = await apiClient.post<PullRequest>("/pull-requests", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create pull request")
    }
  }
  // Add this to your CourseService.ts file

} 