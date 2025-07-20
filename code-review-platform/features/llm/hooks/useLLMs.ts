import { useState, useCallback, useEffect } from "react"
import apiClient from "@/lib/axios"

interface LLM {
  id: number
  user_id: number
  model_name: string
  model_id: string
  model_token: string
  status: string
  created_at: string
  updated_at: string
}

interface CreateLLMParams {
  user_id: number
  model_name: string
  model_id: string
  model_token: string
  status?: string
}

export function useLLMs(userId: number) {
  const [llms, setLLMs] = useState<LLM[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const fetchUserLLMs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await apiClient.get(`/llms/owner/${userId}`)
      setLLMs(response.data || [])
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || "Failed to fetch LLMs")
      console.error("Error fetching LLMs:", err)
    } finally {
      setLoading(false)
    }
  }, [userId])

  const createLLM = async (params: CreateLLMParams) => {
    setLoading(true)
    try {
      // Use FormData to ensure proper data formatting
      const formData = new FormData()
      formData.append('user_id', params.user_id.toString())
      formData.append('model_name', params.model_name)
      formData.append('model_token', params.model_token)
      formData.append('status', params.status || 'active')
      
      // Send as multipart/form-data
      const response = await apiClient.post('/llm/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      // Refresh the list
      await fetchUserLLMs()
      return response.data
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to create LLM"
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const deleteLLM = async (id: number) => {
    setLoading(true)
    try {
      await apiClient.delete(`/llms/${id}`)
      // Refresh the list
      await fetchUserLLMs()
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || "Failed to delete LLM"
      setError(errorMsg)
      throw new Error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  // Fetch LLMs on mount
  useEffect(() => {
    if (userId) {
      fetchUserLLMs()
    }
  }, [userId, fetchUserLLMs])

  return {
    llms,
    loading,
    error,
    fetchUserLLMs,
    createLLM,
    deleteLLM
  }
}