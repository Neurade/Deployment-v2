"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { courseService } from "@/services/course.service"
import { useToast } from "@/hooks/use-toast"
import type { Course } from "@/types/course"

interface EditCourseModalProps {
  isOpen: boolean
  onClose: () => void
  course: Course
  onSuccess: () => void
}

interface CourseFormData {
  course_name: string
  github_url: string
  auto_grade: boolean
  general_answer: string
}

export function EditCourseModal({ isOpen, onClose, course, onSuccess }: EditCourseModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<CourseFormData>({
    course_name: "",
    github_url: "",
    auto_grade: false,
    general_answer: "",
  })

  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        course_name: course.course_name || "",
        github_url: course.github_url || "",
        auto_grade: course.auto_grade || false,
        general_answer: course.general_answer || "",
      })
    }
  }, [course, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("course_name", formData.course_name);
      formDataToSend.append("github_url", formData.github_url);
      formDataToSend.append("auto_grade", String(formData.auto_grade));
      // Convert general_answer text to a File and append
      const generalAnswerBlob = new Blob([formData.general_answer], { type: "text/plain" });
      const generalAnswerFile = new File([generalAnswerBlob], "general_answer.txt", { type: "text/plain" });
      formDataToSend.append("general_answer", generalAnswerFile);

      // Do NOT send created_at or updated_at fields
      await courseService.updateCourse(course.id, formDataToSend);
      toast({
        title: "Success",
        description: "Course updated successfully",
      })
      onSuccess()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update course",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full min-h-[50vh]">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
          <DialogDescription>Update course information</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="course_name"
            value={formData.course_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, course_name: e.target.value }))}
            required
          />

          <Input
            id="github_url"
            value={formData.github_url}
            onChange={(e) => setFormData((prev) => ({ ...prev, github_url: e.target.value }))}
          />

          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              id="auto_grade"
              checked={formData.auto_grade}
              onChange={(e) => setFormData((prev) => ({ ...prev, auto_grade: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300"
            />
            <label htmlFor="auto_grade" className="text-sm font-medium">
              Enable Auto Grade
            </label>
          </div>

          <div>
            <label className="text-sm font-medium">Coding Convention</label>
            <Textarea
              placeholder="Coding Convention content"
              value={formData.general_answer}
              onChange={(e) => setFormData((prev) => ({ ...prev, general_answer: e.target.value }))}
              className="mt-1 w-full min-h-[300px] max-h-[300px] resize-y"
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Update Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
