import axios from "axios"

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 100000,
  
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth-token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("auth-token")
      localStorage.removeItem("user")
      window.location.href = "/login"
    } else if (error.response?.status === 403) {
      // Only show alert for unexpected 403 errors, not for expected permission checks
      const url = error.config?.url || ""
      
      // Don't show alert for these expected permission-related endpoints
      const expectedPermissionEndpoints = [
        '/users', // User management endpoints
        '/courses/permission', // Course permission endpoints
        '/courses-permission', // Course permission updates
        '/assign-user', // User assignment endpoints
      ]
      
      const isExpectedPermissionError = expectedPermissionEndpoints.some(endpoint => 
        url.includes(endpoint)
      )
      
      if (!isExpectedPermissionError) {
        console.warn("Access denied:", error.response?.data || "You don't have permission to access this resource")
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient