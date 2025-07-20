import axios, { type AxiosInstance, type InternalAxiosRequestConfig, type AxiosResponse } from "axios"

// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://103.237.147.55:8085/"
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_ENDPOINT 

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "multipart/form-data",
  },
})

// Request interceptor to add auth token and handle form-data
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth-token")
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    
    // Handle form-data conversion
    if (config.data && typeof config.data === 'object' && !(config.data instanceof FormData)) {
      const formData = new FormData()
      
      Object.keys(config.data).forEach(key => {
        const value = config.data[key]
        if (value !== null && value !== undefined) {
          if (value instanceof File) {
            formData.append(key, value)
          } else if (typeof value === 'object') {
            formData.append(key, JSON.stringify(value))
          } else {
            formData.append(key, String(value))
          }
        }
      })
      
      config.data = formData
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-token")
        localStorage.removeItem("user")
        window.location.href = "/login"
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
