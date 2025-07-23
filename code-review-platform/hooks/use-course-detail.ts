"use client"

import { useState, useEffect, useCallback } from "react"
import { courseService } from "@/services/course.service"
import { userService } from "@/services/user.service"
import type { Course } from "@/types/course"
import type { Assignment } from "@/types/assignment"

export function useCourseDetail(courseId: number, isAdmin: boolean) {
  const [course, setCourse] = useState<Course | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!courseId) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Try to fetch course data first to check permissions
      const courseData = await courseService.getCourse(courseId)
      setCourse(courseData)

      // Build promises array based on user permissions
      const promises: Promise<any>[] = [
        courseService.getCourseAssignments(courseId).catch(() => []), // Fallback to empty array
      ]

      // Only fetch course users and all users if admin
      if (isAdmin) {
        promises.push(
          courseService.getCourseUsers(courseId).catch(() => []), // Fallback to empty array
          userService.getUsers().catch(() => []) // Fallback to empty array
        )
      }

      const results = await Promise.all(promises)
      
      setAssignments(results[0])
      
      if (isAdmin) {
        setManagers(results[1] || [])
        setAllUsers(results[2] || [])
      } else {
        // For non-admin users, set empty arrays
        setManagers([])
        setAllUsers([])
      }

    } catch (err: any) {
      console.error("Error fetching course data:", err)
      
      // Handle specific error types
      if (err.response?.status === 403) {
        setError("You don't have permission to view this course")
      } else if (err.response?.status === 404) {
        setError("Course not found")
      } else if (err.response?.status === 401) {
        setError("You need to be logged in to view this course")
      } else {
        setError(err.message || "Failed to load course data")
      }
      
      // Reset data on error
      setCourse(null)
      setAssignments([])
      setManagers([])
      setAllUsers([])
    } finally {
      setLoading(false)
    }
  }, [courseId, isAdmin])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const assignManager = async (userId: number) => {
    if (!isAdmin) {
      throw new Error("Only admins can assign managers")
    }
    
    try {
      // This uses the route: POST /courses/{course_id}/assign-user/{user_id}
      await courseService.assignUserToCourse(courseId, userId)
      await fetchAll()
    } catch (err: any) {
      console.error("Error assigning manager:", err)
      throw err // Re-throw so the component can handle it
    }
  }

  return {
    course,
    assignments,
    managers,
    allUsers,
    loading,
    error,
    assignManager,
    refetch: fetchAll,
  }
}