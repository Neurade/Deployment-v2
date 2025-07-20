"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useCourses } from "@/features/courses/hooks/useCourses"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, BookOpen, Users, FileText, Calendar, Github } from "lucide-react"

export default function CoursePage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = Number.parseInt(params.userID as string)

  const { courses, loading, error, fetchCourses } = useCourses(userId)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (userId) {
      fetchCourses()
    }
  }, [userId, fetchCourses])

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchCourses()}>Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
            <p className="text-gray-600 mt-2">Manage your courses and assignments</p>
          </div>
          <Link href={`/${userId}/course/new`}>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">Create your first course to get started</p>
              <Link href={`/${userId}/course/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{course.course_name}</CardTitle>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      course.auto_grade ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    }`}>
                      {course.auto_grade ? "Auto Grade" : "Manual"}
                    </div>
                  </div>
                  {/* <CardDescription>
                    {course.assignments.length} assignments • {course.student_count} students
                  </CardDescription> */}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Github className="h-4 w-4 mr-2" />
                    <span className="truncate">{course.github_url}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {new Date(course.created_at).toLocaleDateString()}</span>
                    <span>Updated {new Date(course.updated_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/${userId}/course/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
