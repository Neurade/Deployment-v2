export interface User {
  id: number
  email: string
  username?: string
  role: "super_admin" | "teacher"
  github_token?: string
  verified: boolean
  created_at: string
  updated_at: string
  assigned_courses?: number[]
}

export interface LoginRequest {
  email: string
  password: string
}

export interface CreateUserRequest {
  email: string
  password: string
  role: "teacher"
  assigned_courses?: number[]
}

export interface UpdateUserRequest {
  email?: string
  password?: string
  github_token?: string
  assigned_courses?: number[]
}
export interface SuperAdminConfigRequest {
  email: string
  password: string
  confirmPassword: string
}