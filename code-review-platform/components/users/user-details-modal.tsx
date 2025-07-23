"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { courseService } from "@/services/course.service"
import type { User } from "@/types/user"
import type { Course } from "@/types/course"

interface UserDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  courses: Course[]
  getCourseNames: (courseIds: number[]) => string[]
}

export function UserDetailsModal({ open, onOpenChange, user, courses, getCourseNames }: UserDetailsModalProps) {
  const [userCourses, setUserCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch courses that the user has permission to access
  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!user || !open) return

      setLoading(true)
      setError(null)

      try {
        // Use the permission-based API endpoint to get courses assigned to this user
        const permissionCourses = await courseService.getCoursesByPermission(user.id)
        setUserCourses(permissionCourses)
      } catch (err: any) {
        console.error("Error fetching user courses:", err)
        setError(err.message || "Failed to fetch user courses")
        setUserCourses([])
      } finally {
        setLoading(false)
      }
    }

    fetchUserCourses()
  }, [user, open])

  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>View user information and assigned courses</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Email:</span>
              <p className="mt-1">{user.email}</p>
            </div>
            <div>
              <span className="font-medium text-gray-600">Role:</span>
              <span className="mt-1 block">
                <Badge variant="default">Teacher</Badge>
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Created:</span>
              <p className="mt-1">{new Date(user.created_at).toLocaleDateString("en-US")}</p>
            </div>
         
          </div>
          
          <div>
            <span className="font-medium text-gray-600">Courses with Permission:</span>
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-500">Loading courses...</span>
                </div>
              ) : error ? (
                <p className="text-red-500 text-sm">Error: {error}</p>
              ) : userCourses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {userCourses.map((course) => (
                    <Badge key={course.id} variant="outline" className="text-xs">
                      {course.course_name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No courses assigned</p>
              )}
            </div>
            
            {!loading && !error && userCourses.length > 0 && (
              <div className="mt-2 text-xs text-gray-500">
                Total: {userCourses.length} course{userCourses.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}