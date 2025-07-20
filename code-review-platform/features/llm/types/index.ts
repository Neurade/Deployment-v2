export interface LLM {
  id: number
  user_id: number
  model_name: string
  model_id: string
  model_token: string
  status: string
  created_at: string
  updated_at: string
}

export interface LLMCreateRequest {
  user_id: number
  model_name: string
  model_id: string
  model_token: string
}

interface ResultData {
  summary?: string;
  message?: string;
  reviewURL?: string;
  status?: string;
  processed_at?: string;
  comments?: {
    path?: string;
    position?: number;
    body?: string;
  }[];
}
