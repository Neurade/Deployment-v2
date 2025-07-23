"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { GeneralAnswerModal } from "@/components/courses/general-answer-modal"
import type { Course } from "@/types/course"

interface CourseInfoProps {
  course: Course
}

export function CourseInfo({ course }: CourseInfoProps) {
  const [showGeneralAnswer, setShowGeneralAnswer] = useState(false)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Basic details about this course</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Github className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Repository:</span>
            <a
              href={course.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              {course.github_url}
            </a>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">Created:</span>
            <span className="text-sm">{new Date(course.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Auto Grade:</span>
            <span
              className={cn(
                "px-2 py-1 text-xs rounded-full",
                course.auto_grade ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800",
              )}
            >
              {course.auto_grade ? "Enabled" : "Disabled"}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Coding Convention</CardTitle>
            <CardDescription>Instructions and guidelines for this course</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={() => setShowGeneralAnswer(true)}>
            View Coding Convention
          </Button>
        </CardHeader>
      </Card>

      <GeneralAnswerModal
        isOpen={showGeneralAnswer}
        onClose={() => setShowGeneralAnswer(false)}
        courseId={course.id}
      />
    </>
  )
}
