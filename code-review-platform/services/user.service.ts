import apiClient from "@/lib/axios"
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types/user"
import type { Course } from "@/types/course"

export const userService = {
  async getUsers(): Promise<User[]> {
    const response = await apiClient.get<User[]>("/users")
    return response.data
  },

  async createUser(userData: CreateUserRequest): Promise<User> {
    const formData = new FormData()
    formData.append('email', userData.email)
    formData.append('password', userData.password)
    formData.append('role', userData.role)
    
    if (userData.assigned_courses) {
      userData.assigned_courses.forEach(courseId => {
        formData.append('assigned_courses[]', courseId.toString())
      })
    }

    const response = await apiClient.post<User>("/users", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async updateUser(userId: number, userData: UpdateUserRequest): Promise<User> {
    const formData = new FormData()
    
    if (userData.email) formData.append('email', userData.email)
    if (userData.password) formData.append('password', userData.password)
    if (userData.github_token) formData.append('github_token', userData.github_token)
    
    if (userData.assigned_courses) {
      userData.assigned_courses.forEach(courseId => {
        formData.append('assigned_courses[]', courseId.toString())
      })
    }

    const response = await apiClient.put<User>(`/users/${userId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async deleteUser(userId: number): Promise<void> {
    await apiClient.delete(`/users/${userId}`)
  },

  async updateGitHubToken(userId: number, token: string): Promise<User> {
    const formData = new FormData()
    formData.append('github_token', token)

    const response = await apiClient.put<User>(`/users/${userId}/github-token`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  async validateGitHubToken(token: string): Promise<boolean> {
    try {
      const formData = new FormData()
      formData.append('token', token)

      const response = await apiClient.post<{ valid: boolean }>("/users/validate-github-token", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data.valid
    } catch {
      return false
    }
  },

  async lockUser(userId: number): Promise<void> {
    await apiClient.put(`/users/${userId}/lock`);
  },

  async assignCourseToUser(userId: number, courseId: number): Promise<void> {
    await apiClient.post(`/courses/${courseId}/assign-user/${userId}`);
  },

  async getCoursesByUserPermission(userId: number): Promise<Course[]> {
    const response = await apiClient.get<Course[]>(`/courses/permission/${userId}`);
    return response.data;
  },

  async fetchGithubToken(): Promise<string> {
  try {
    const response = await apiClient.get<{ github_token: string }>("/users/github-token", {
      withCredentials: true,
    })
    return response.data.github_token || ""
  } catch (error) {
    return ""
  }
},
}