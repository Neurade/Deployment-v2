import apiClient from "@/lib/axios"
import type { User, LoginRequest } from "@/types/user"
import type { LoginResponse } from "@/types/auth"
import type { SuperAdminConfigRequest } from "@/types"

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const formData = new FormData()
    formData.append("email", credentials.email)
    formData.append("password", credentials.password)
    const response = await apiClient.post<LoginResponse>("/auth/login", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  async configureAdmin(config: SuperAdminConfigRequest): Promise<any> {
    const formData = new FormData()
    formData.append("email", config.email)
    formData.append("password", config.password)

    const response = await apiClient.post("/auth/admin-config", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    return response.data
  },

  async logout(): Promise<void> {
    localStorage.removeItem("auth-token")
    localStorage.removeItem("user")
  },

  canAccessCourse(user: User, courseId: number): boolean {
    if (user.role === "super_admin") return true
    return user.assigned_courses?.includes(courseId) || false
  },
}
