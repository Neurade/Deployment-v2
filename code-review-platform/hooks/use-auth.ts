"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { authService } from "@/services/auth.service"
import type { User, LoginRequest } from "@/types/user"

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const login = useCallback(
    async (credentials: LoginRequest) => {
      try {
        setLoading(true)
        setError(null)
        const response = await authService.login(credentials)

        localStorage.setItem("auth-token", response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
        setUser(response.user)

        router.push(`/courses`)
        return response
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || "Login failed"
        setError(errorMessage)
        throw new Error(errorMessage)
      } finally {
        setLoading(false)
      }
    },
    [router],
  )

  const logout = useCallback(async () => {
    try {
      await authService.logout()
      setUser(null)
      router.push("/login")
    } catch (err) {
      console.error("Logout error:", err)
      setUser(null)
      router.push("/login")
    }
  }, [router])

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const userData = localStorage.getItem("user")

      if (!token || !userData) {
        setLoading(false)
        return false
      }

      const user = JSON.parse(userData)
      setUser(user)
      setLoading(false)
      return true
    } catch (err) {
      console.error("Auth check error:", err)
      localStorage.removeItem("auth-token")
      localStorage.removeItem("user")
      setLoading(false)
      return false
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    isAuthenticated: !!user,
    isAdmin: user?.role === "super_admin",
  }
}
