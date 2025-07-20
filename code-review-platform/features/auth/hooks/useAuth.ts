"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { AuthService } from "../services/authService"
import type { User, LoginRequest, RegisterRequest, AuthState } from "../types"

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
    error: null,
  })
  const router = useRouter()

  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await AuthService.login(credentials)
      if (typeof window !== "undefined") {
        localStorage.setItem("auth-token", response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
      }
      setState({
        user: response.user,
        token: response.token,
        loading: false,
        error: null,
      })
      return response
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const register = useCallback(async (userData: RegisterRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    try {
      const response = await AuthService.register(userData)
      if (typeof window !== "undefined") {
        localStorage.setItem("auth-token", response.token)
        localStorage.setItem("user", JSON.stringify(response.user))
      }
      setState({
        user: response.user,
        token: response.token,
        loading: false,
        error: null,
      })
      return response
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
      throw error
    }
  }, [])

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    try {
      await AuthService.logout()
      setState({
        user: null,
        token: null,
        loading: false,
        error: null,
      })
      router.push("/login")
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message,
      }))
    }
  }, [router])

  const checkAuth = useCallback(async () => {
    if (typeof window === "undefined") return

    const token = localStorage.getItem("auth-token")
    const userStr = localStorage.getItem("user")

    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr)
        setState({
          user,
          token,
          loading: false,
          error: null,
        })
      } catch (error) {
        // Invalid stored data, clear it
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user")
        setState({
          user: null,
          token: null,
          loading: false,
          error: null,
        })
      }
    } else {
      setState(prev => ({ ...prev, loading: false }))
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  return {
    user: state.user,
    token: state.token,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    checkAuth,
  }
} 