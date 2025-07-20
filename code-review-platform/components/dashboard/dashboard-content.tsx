"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useCourses } from "@/features/courses/hooks/useCourses"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, BookOpen, Users, FileText, GitPullRequest, Calendar } from "lucide-react"

export function DashboardContent() {
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={() => fetchCourses()}>Retry</Button>
      </div>
    )
  }

  const totalCourses = courses.length
  const totalAssignments = courses.reduce((sum, course) => sum + course.assignment_count, 0)
  const totalStudents = courses.reduce((sum, course) => sum + course.student_count, 0)

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.username || user?.email}!
        </h1>
        <p className="text-gray-600">
          Manage your courses, assignments, and student progress from your dashboard.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCourses}</div>
            <p className="text-xs text-muted-foreground">
              Active courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Assignments</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">
              Across all courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Get started with common tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href={`/${userId}/course/new`}>
              <Button className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create New Course
              </Button>
            </Link>
            
            <Link href={`/${userId}/course`}>
              <Button variant="outline" className="w-full justify-start">
                <BookOpen className="mr-2 h-4 w-4" />
                View All Courses
              </Button>
            </Link>
            
            <Link href={`/${userId}/profile`}>
              <Button variant="outline" className="w-full justify-start">
                <Users className="mr-2 h-4 w-4" />
                Manage Profile
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Courses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Courses</CardTitle>
            <Link href={`/${userId}/course`}>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </Link>
          </div>
          <CardDescription>
            Your most recently updated courses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-4">Create your first course to get started</p>
              <Link href={`/${userId}/course/new`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Course
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {courses.slice(0, 3).map((course) => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <BookOpen className="h-8 w-8 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{course.course_name}</h4>
                      <p className="text-sm text-gray-500">
                        {course.assignment_count} assignments • {course.student_count} students
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {new Date(course.updated_at).toLocaleDateString()}
                    </span>
                    <Link href={`/${userId}/course/${course.id}`}>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 