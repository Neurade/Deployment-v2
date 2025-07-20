import apiClient from "@/lib/axios"
import type { LLM, LLMCreateRequest } from "../types"

export class LLMService {
  static async createLLM(llmData: LLMCreateRequest): Promise<LLM> {
    try {
      const response = await apiClient.post<LLM>("/llms", llmData)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to create LLM")
    }
  }

  static async getLLMById(id: number): Promise<LLM> {
    try {
      const response = await apiClient.get<LLM>(`/llms/${id}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch LLM")
    }
  }

  static async getUserLLMs(userId: number): Promise<LLM[]> {
    try {
      const response = await apiClient.get<LLM[]>(`/llms/owner/${userId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch user LLMs")
    }
  }
}