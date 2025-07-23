"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { CreateCourseRequest } from "@/types/course"

interface CreateCourseModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateCourseRequest & { generalAnswerFile?: File }) => Promise<void>
}

export function CreateCourseModal({ open, onOpenChange, onSubmit }: CreateCourseModalProps) {
  const [formData, setFormData] = useState<CreateCourseRequest & { generalAnswerFile?: File }>({
    course_name: "",
    github_url: "",
    general_answer: "",
    auto_grade: false,
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      // Validate required fields
      const newErrors: Record<string, string> = {}
      if (!formData.course_name.trim()) {
        newErrors.course_name = "Tên khóa học là bắt buộc"
      }
      if (!formData.github_url.trim()) {
        newErrors.github_url = "URL repository là bắt buộc"
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        return
      }

      await onSubmit(formData)

      // Reset form
      setFormData({
        course_name: "",
        github_url: "",
        general_answer: "",
        auto_grade: false,
      })
      onOpenChange(false)
    } catch (error: any) {
      setErrors({ general: error.message || "Không thể tạo khóa học" })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setFormData((prev) => ({
          ...prev,
          general_answer: content,
          generalAnswerFile: file,
        }))
      }
      reader.readAsText(file)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{errors.general}</div>}

          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name *</Label>
            <Input
              id="course_name"
              value={formData.course_name}
              onChange={(e) => setFormData((prev) => ({ ...prev, course_name: e.target.value }))}
              placeholder="Enter course name"
            />
            {errors.course_name && <p className="text-sm text-red-600">{errors.course_name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="github_url">Repository URL *</Label>
            <Input
              id="github_url"
              value={formData.github_url}
              onChange={(e) => setFormData((prev) => ({ ...prev, github_url: e.target.value }))}
              placeholder="https://github.com/username/repository"
            />
            {errors.github_url && <p className="text-sm text-red-600">{errors.github_url}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="general_answer_file">Coding Convention File (optional)</Label>
            <input
              id="general_answer_file"
              type="file"
              accept=".txt,.md"
              onChange={handleFileChange}
              className="w-full border rounded px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-500">Only .txt or .md files are accepted</p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="auto_grade"
              checked={formData.auto_grade}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, auto_grade: checked }))}
            />
            <Label htmlFor="auto_grade">Enable Auto Grading</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
