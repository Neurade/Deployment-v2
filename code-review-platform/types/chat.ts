export interface Chat {
  id: number
  course_id: number
  user_id: number
  pr_id: number
  chat_history: any
  created_at: string
  updated_at: string
}

export interface CreateChatRequest {
  course_id: number
  user_id: number
  pr_id: number
  chat_history: any
}
