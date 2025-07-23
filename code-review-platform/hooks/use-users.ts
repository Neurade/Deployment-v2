"use client"

import { useState, useEffect, useCallback } from "react"
import { userService } from "@/services/user.service"
import type { User, CreateUserRequest, UpdateUserRequest } from "@/types/user"

export function useUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      const data = await userService.getUsers()
      setUsers(data)
      setError(null)
    } catch (err) {
      setError("Không thể tải danh sách người dùng")
      console.error("Error fetching users:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  const createUser = useCallback(async (userData: CreateUserRequest) => {
    try {
      const newUser = await userService.createUser(userData)
      setUsers((prev) => [...prev, newUser])
      return { success: true, message: "Tạo người dùng thành công" }
    } catch (err) {
      console.error("Error creating user:", err)
      return { success: false, message: "Không thể tạo người dùng" }
    }
  }, [])

  const updateUser = useCallback(async (userId: number, userData: UpdateUserRequest) => {
    try {
      const updatedUser = await userService.updateUser(userId, userData)
      setUsers((prev) => prev.map((user) => (user.id === userId ? updatedUser : user)))
      return { success: true, message: "Cập nhật người dùng thành công" }
    } catch (err) {
      console.error("Error updating user:", err)
      return { success: false, message: "Không thể cập nhật người dùng" }
    }
  }, [])

  const deleteUser = useCallback(async (userId: number) => {
    try {
      await userService.deleteUser(userId)
      setUsers((prev) => prev.filter((user) => user.id !== userId))
      return { success: true, message: "Xóa người dùng thành công" }
    } catch (err) {
      console.error("Error deleting user:", err)
      return { success: false, message: "Không thể xóa người dùng" }
    }
  }, [])

  const lockUser = useCallback(async (userId: number) => {
    try {
      await userService.lockUser(userId);
      await fetchUsers();
      return { success: true, message: "Khóa người dùng thành công" };
    } catch (err) {
      return { success: false, message: "Không thể khóa người dùng" };
    }
  }, [fetchUsers]);

  const assignCourseToUser = useCallback(async (userId: number, courseId: number) => {
    try {
      await userService.assignCourseToUser(userId, courseId);
      await fetchUsers();
      return { success: true, message: "Phân quyền thành công" };
    } catch (err) {
      return { success: false, message: "Không thể phân quyền" };
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    lockUser,
    assignCourseToUser,
    refetch: fetchUsers,
  }
}
