import apiClient from "@/lib/axios"

export class UserService {
  static async getUserById(userId: number): Promise<any> {
    try {
      const response = await apiClient.get(`/users/${userId}`)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to fetch user data")
    }
  }

  static async updateProfile(userId: number, data: { github_token?: string }): Promise<any> {
    try {
      const response = await apiClient.put(`/users/${userId}/github-token`, data)
      return response.data
    } catch (error: any) {
      throw new Error(error.response?.data?.message || "Failed to update profile")
    }
  }
}