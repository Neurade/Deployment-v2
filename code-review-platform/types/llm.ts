export interface LLM {
  id: number
  user_id: number
  model_name: string
  model_id: string
  model_token: string
  provider: string
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface CreateLLMRequest {
  model_name: string
  model_id: string
  model_token: string
  provider: string
  user_id: number // Add this field
}
