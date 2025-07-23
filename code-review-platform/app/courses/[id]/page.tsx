"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCourseDetail } from "@/hooks/use-course-detail"
import { Sidebar } from "@/components/layout/sidebar"
import { CourseHeader } from "@/components/courses/course-header"
import { CourseStats } from "@/components/courses/course-stats"
import { CourseInfo } from "@/components/courses/course-info"
import { AssignmentSection } from "@/components/courses/assignment-section"
import { QuickActions } from "@/components/courses/quick-actions"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { Button } from "@/components/ui/button"
import { BookOpen, ArrowLeft } from "lucide-react"

export default function CourseDetailPage() {
  const { isAuthenticated, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const params = useParams()
  const courseId = Number(params.id)

  const { course, assignments, loading, error, refetch } = useCourseDetail(courseId, isAdmin)

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [authLoading, isAuthenticated, router])

  // Handle permission errors by redirecting back to courses
  useEffect(() => {
    if (error && (
      error.includes("permission") || 
      error.includes("not found") ||
      error.includes("logged in")
    )) {
      // Show error for a moment then redirect
      const timer = setTimeout(() => {
        router.push("/courses")
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [error, router])

  if (authLoading || loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // Will redirect to login
  }

  if (error) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <BookOpen className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {error.includes("permission") ? "Access Denied" : "Course Not Available"}
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500 mb-4">Redirecting back to courses...</p>
            <Button onClick={() => router.push("/courses")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </div>
        </main>
      </div>
    )
  }

  if (!course) {
    return null
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8 space-y-6">
          <CourseHeader course={course} isAdmin={isAdmin} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <CourseInfo course={course} />
              <AssignmentSection courseId={courseId} assignments={assignments} onRefetch={refetch} />
            </div>

            <div className="space-y-6">
              <CourseStats course={course} assignmentCount={assignments.length} />
              <QuickActions courseId={courseId} course={course} onRefetch={refetch} isAdmin={isAdmin} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}