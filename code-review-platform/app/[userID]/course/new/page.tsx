"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useCourses } from "@/features/courses/hooks/useCourses"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus } from "lucide-react"

export default function NewCoursePage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = Number.parseInt(params.userID as string)

  const { createCourse, loading, error } = useCourses(userId)

  const [formData, setFormData] = useState({
    course_name: "",
    github_url: "",
    general_answer: null as File | null,
    auto_grade: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Basic validation
    const newErrors: Record<string, string> = {}
    if (!formData.course_name) newErrors.course_name = "Course name is required"
    if (!formData.github_url) newErrors.github_url = "GitHub URL is required"
    if (!formData.general_answer) newErrors.general_answer = "General answer is required"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      if (!formData.general_answer) {
        setErrors({ general_answer: "Please select a file" })
        return
      }
      
      // Validate file type again as a safety measure
      const fileName = formData.general_answer.name.toLowerCase();
      if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
        setErrors({ general_answer: "Only Markdown (.md) or text (.txt) files are allowed" });
        return;
      }
      
      const newCourse = await createCourse({
        user_id: userId,
        course_name: formData.course_name,
        github_url: formData.github_url,
        general_answer: formData.general_answer,
        auto_grade: formData.auto_grade,
      })
      router.push(`/${userId}/course/${newCourse.id}`)
    } catch (error: any) {
      setErrors({ general: error.message })
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? checked : value 
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }))
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <Link href={`/${userId}/course`}>
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Courses
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Course</h1>
          <p className="text-gray-600 mt-2">Set up a new course for your students</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6" />
              <CardTitle>Course Information</CardTitle>
            </div>
            <CardDescription>
              Fill in the details for your new course
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {errors.general}
                </div>
              )}

              <Input
                label="Course Name"
                name="course_name"
                value={formData.course_name}
                onChange={handleChange}
                error={errors.course_name}
                placeholder="Enter course name"
                required
              />

              <Input
                label="GitHub Repository URL"
                name="github_url"
                value={formData.github_url}
                onChange={handleChange}
                error={errors.github_url}
                placeholder="https://github.com/username/repository"
                required
              />

              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  General Answer (.md or .txt)
                </label>
                <input
                  type="file"
                  name="general_answer"
                  accept=".md,.txt"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    
                    // Validate file type
                    if (file) {
                      const fileName = file.name.toLowerCase();
                      if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
                        setErrors(prev => ({
                          ...prev,
                          general_answer: "Only Markdown (.md) or text (.txt) files are allowed"
                        }));
                        // Reset the input
                        e.target.value = '';
                        return;
                      } else {
                        // Clear any previous errors if file is valid
                        if (errors.general_answer) {
                          setErrors(prev => ({ ...prev, general_answer: "" }));
                        }
                      }
                    }
                    
                    setFormData(prev => ({
                      ...prev,
                      general_answer: file
                    }));
                  }}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Upload a Markdown (.md) or text (.txt) file with general instructions
                </p>
                {errors.general_answer && (
                  <p className="mt-1 text-sm text-red-600">{errors.general_answer}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="auto_grade"
                  name="auto_grade"
                  checked={formData.auto_grade}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="auto_grade" className="text-sm font-medium text-gray-700">
                  Enable Auto Grading
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  loading={loading}
                  disabled={loading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
                <Link href={`/${userId}/course`}>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
