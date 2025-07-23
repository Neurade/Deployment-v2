import apiClient from "@/lib/axios"
import type { LLM, CreateLLMRequest } from "@/types/llm"

export const llmService = {
  async getLLMs(userId: number): Promise<LLM[]> {
    const response = await apiClient.get<LLM[]>(`/llms/owner/${userId}`)
    return response.data
  },

  async createLLM(llmData: CreateLLMRequest): Promise<LLM> {
    // Use FormData as required by backend
    const formData = new FormData()
    formData.append('model_name', llmData.model_name)
    formData.append('model_id', llmData.model_id)
    formData.append('model_token', llmData.model_token)
    formData.append('provider', llmData.provider)
    formData.append('user_id', llmData.user_id.toString()) // Add user_id to FormData
    
    // Add timestamps
    const now = new Date().toISOString()
    formData.append('created_at', now)
    formData.append('updated_at', now)

    console.log('Creating LLM with FormData:')
    for (let [key, value] of formData.entries()) {
      console.log(key, value)
    }

    const response = await apiClient.post<LLM>("/llms", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async updateLLM(llmId: number, llmData: Partial<CreateLLMRequest>): Promise<LLM> {
    const response = await apiClient.put<LLM>(`/llms/${llmId}`, llmData)
    return response.data
  },

  async deleteLLM(llmId: number): Promise<void> {
    await apiClient.delete(`/llms/${llmId}`)
  },

  async verifyTokenAndGetModels(provider: string, token: string): Promise<{ models: string[] }> {
    // Use FormData as required by backend
    const formData = new FormData()
    formData.append('provider', provider)
    formData.append('token', token)

    const response = await apiClient.post<{ models: string[] }>("/llms/provider", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async getLLM(llmId: number): Promise<LLM> {
    const response = await apiClient.get<LLM>(`/llms/${llmId}`)
    return response.data
  },

  async getAdminLLMs(): Promise<LLM[]> {
    const response = await apiClient.get<LLM[]>("/llms/admin")
    return response.data
  }
}
