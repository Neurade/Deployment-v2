export interface User {
  id: number
  username: string
  email: string
  role: string
  verified: boolean
  github_token?: string
  created_at: string
  updated_at: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  role: string
}

export interface AuthResponse {
  token: string
  user: User
  refresh_token?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
} 