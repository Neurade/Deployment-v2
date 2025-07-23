"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Settings } from "lucide-react"
import type { Course } from "@/types/course"

interface CourseHeaderProps {
  course: Course
  isAdmin: boolean
}

export function CourseHeader({ course, isAdmin }: CourseHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{course.course_name}</h1>
        <div className="flex items-center space-x-4">
          <Badge variant={course.auto_grade ? "default" : "secondary"}>
            {course.auto_grade ? "Auto Grade Enabled" : "Manual Grade"}
          </Badge>
          {course.github_url && (
            <a
              href={course.github_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-600 hover:underline text-sm"
            >
              <ExternalLink className="h-4 w-4" />
              {course.owner}/{course.repo_name}
            </a>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="flex space-x-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Edit Course
          </Button>
        </div>
      )}
    </div>
  )
}
