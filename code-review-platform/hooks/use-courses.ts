"use client"

import { useState, useCallback, useEffect } from "react"
import type { Course, CreateCourseRequest } from "@/types/course"
import { courseService } from "@/services/course.service"
import { useAuth } from "./use-auth"

export function useCourses(userId: number, usePermissionBased: boolean = false) {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { isAdmin } = useAuth()

  const fetchCourses = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      let fetchedCourses: Course[]
      
      if (isAdmin && !usePermissionBased) {
        // Super admin gets all courses they own
        fetchedCourses = await courseService.getCoursesByOwner(userId)
      } else {
        // Teachers get courses assigned to them via permission
        fetchedCourses = await courseService.getCoursesByPermission(userId)
      }
      
      setCourses(fetchedCourses)
      setError(null)
    } catch (err: any) {
      setError(err.message || "Failed to fetch courses")
      setCourses([])
    } finally {
      setLoading(false)
    }
  }, [userId, isAdmin, usePermissionBased])

  const createCourse = useCallback(async (courseData: CreateCourseRequest & { generalAnswerFile?: File }) => {
    try {
      const newCourse = await courseService.createCourse(courseData)
      setCourses((prev) => [newCourse, ...prev])
      return { success: true, course: newCourse }
    } catch (err: any) {
      setError(err.message || "Failed to create course")
      return { success: false, message: err.message }
    }
  }, [])

  const updateCourse = useCallback(async (courseId: number, updates: Partial<Course>) => {
    try {
      const updatedCourse = await courseService.updateCourse(courseId, updates)
      setCourses((prev) =>
        prev.map((course) => (course.id === courseId ? updatedCourse : course))
      )
      return { success: true, course: updatedCourse }
    } catch (err: any) {
      setError(err.message || "Failed to update course")
      return { success: false, message: err.message }
    }
  }, [])

  const deleteCourse = useCallback(async (courseId: number) => {
    try {
      await courseService.deleteCourse(courseId)
      setCourses((prev) => prev.filter((course) => course.id !== courseId))
      return { success: true }
    } catch (err: any) {
      setError(err.message || "Failed to delete course")
      return { success: false, message: err.message }
    }
  }, [])

  useEffect(() => {
    fetchCourses()
  }, [fetchCourses])

  return {
    courses,
    loading,
    error,
    createCourse,
    updateCourse,
    deleteCourse,
    refetch: fetchCourses,
  }
}