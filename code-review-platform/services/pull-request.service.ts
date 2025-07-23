import apiClient from "@/lib/axios"
import type { PullRequest, CreatePullRequestRequest, UpdateResultRequest, ReviewRequest } from "@/types/pull-request"
import { toast } from "@/components/ui/use-toast"
export const pullRequestService = {
  // Get all pull requests for a course
  async getPullRequestsByCourse(courseId: number): Promise<PullRequest[]> {
    const response = await apiClient.get<PullRequest[]>(`/webhooks/course/${courseId}/pull-requests`)
    return response.data
  },

  // Create a new pull request (send as FormData)
  async createPullRequest(data: CreatePullRequestRequest): Promise<PullRequest> {
    const formData = new FormData()
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) formData.append(key, value as any)
    })
  
    const response = await apiClient.post<PullRequest>("/pull-requests", formData)
    return response.data
  },

  // Get pull request by ID
  async getPullRequestById(prId: number): Promise<PullRequest> {
    const response = await apiClient.get<PullRequest>(`/pull-requests/${prId}`)
    return response.data
  },

  // Update pull request result (send as FormData)
  async updateResult(prId: number, data: UpdateResultRequest): Promise<PullRequest> {
    const formData = new FormData()
    formData.append("result", JSON.stringify(data)) // send all result data as a JSON string
    const response = await apiClient.put<PullRequest>(`/pull-requests/${prId}/result`, formData)
    return response.data
  },

  // Post review to GitHub (send as FormData)
  async postReviewToGitHub(prId: number, courseId: number): Promise<void> {
    const formData = new FormData()
    formData.append("pr_id", String(prId))
    formData.append("course_id", String(courseId))
    await apiClient.put(`/pull-requests/${prId}/review`, formData)
  },
  async fetchPullRequests(courseId: number): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append("course_id", String(courseId))
    console.log("Fetching pull requests via webhook for course:", courseId)
    const response =  await apiClient.post("/webhooks/fetch-pull-requests", formData)

    return response.data
  }
,
  // Review PR with AI agent (send as FormData)
  async reviewPR(data: {
    user_id: number
    course_id: number
    assignment_id: number
    llm_id: number
    pr_ids: string // comma-separated string
  }): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append("user_id", String(data.user_id))
    formData.append("course_id", String(data.course_id))
    formData.append("assignment_id", String(data.assignment_id))
    formData.append("llm_id", String(data.llm_id))
    formData.append("pr_ids", data.pr_ids) // comma-separated string
    const response = await apiClient.post<{ message: string }>("/agent/review-pr", formData)
    return response.data
  },

  // Auto review PRs with AI agent (send as FormData)
  async autoReviewPR(data: {
    user_id: number
    course_id: number
    assignment_id: number
    llm_id: number
    pr_ids: number[]
  }): Promise<{ message: string }> {
    const formData = new FormData()
    formData.append("user_id", String(data.user_id))
    formData.append("course_id", String(data.course_id))
    formData.append("assignment_id", String(data.assignment_id))
    formData.append("llm_id", String(data.llm_id))
    formData.append("pr_ids", JSON.stringify(data.pr_ids)) // send as JSON string
    const response = await apiClient.post<{ message: string }>("/agent/review-pr-auto", formData)
    return response.data
  }
}