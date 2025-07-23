"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useEffect, useState } from "react"
import { courseService } from "@/services/course.service"
import { LoadingSpinner } from "@/components/common/loading-spinner"
import { useParams, useRouter } from "next/navigation"

interface GeneralAnswerModalProps {
  isOpen: boolean
  onClose: () => void
  courseId: number
}

export function GeneralAnswerModal({ isOpen, onClose, courseId }: GeneralAnswerModalProps) {
  const [content, setContent] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const params = useParams()
  courseId = Number(params.id)
  useEffect(() => {
    if (!isOpen || !courseId || !Number.isFinite(courseId)) return;
  
    setLoading(true);
    setError(null);
    setContent("");
  
    courseService.getCourse(courseId)
      .then((course) => {
        setContent(course.general_answer || "No Coding Convention available.");
      })
      .catch(() => {
        setError("Failed to load Coding Convention.");
      })
      .finally(() => setLoading(false));
  }, [isOpen, courseId]);
  
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full min-h-[60vh]">
        <DialogHeader>
          <DialogTitle>Coding Convention</DialogTitle>
          <DialogDescription>Coding Convention content for this course.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] min-h-[60vh] overflow-auto bg-gray-50 p-4 rounded-md">
          {loading ? (
            <div className="flex items-center justify-center h-full"><LoadingSpinner /></div>
          ) : error ? (
            <div className="text-red-600">{error}</div>
          ) : (
            <pre className="whitespace-pre-wrap break-all text-sm text-gray-700">{content}</pre>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
