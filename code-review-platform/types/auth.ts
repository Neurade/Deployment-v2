import type { User } from "./user" // Assuming User is defined in a separate file

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

export interface LoginResponse {
  success: boolean
  message: string
  user: User
  token: string
}
