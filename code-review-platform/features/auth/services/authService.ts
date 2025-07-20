import apiClient from "@/lib/axios"
import { objectToFormData } from "@/lib/utils"
import type { LoginRequest, RegisterRequest, AuthResponse, User } from "../types"

export class AuthService {
  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const formData = objectToFormData(credentials)
      
      const response = await apiClient.post<AuthResponse>("/auth/login", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Login failed")
    }
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const formData = objectToFormData(userData)
      
      const response = await apiClient.post<AuthResponse>("/auth/register", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Registration failed")
    }
  }

  static async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout")
    } catch (error: any) {
      console.error("Logout error:", error)
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user")
      }
    }
  }

  static async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>("/auth/me")
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to get current user")
    }
  }

  static async refreshToken(): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>("/auth/refresh")
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Token refresh failed")
    }
  }
} 