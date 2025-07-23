"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar } from "lucide-react"
import { useEffect, useState } from "react"
import { assignmentService } from "@/services/assignment.service"
import type { Assignment } from "@/types/assignment"
import { LoadingSpinner } from "@/components/common/loading-spinner"

interface AssignmentDetailModalProps {
  assignment: Assignment | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: (id: number) => void
}

export function AssignmentDetailModal({ assignment, open, onOpenChange, onDelete }: AssignmentDetailModalProps) {
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<Assignment | null>(assignment)

  useEffect(() => {
    if (open && assignment?.id) {
      setLoading(true)
      assignmentService.getAssignment(assignment.id)
        .then(setDetail)
        .finally(() => setLoading(false))
    } else {
      setDetail(assignment)
    }
  }, [open, assignment])

  if (!detail) return null
  console.log(detail)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {detail.assignment_name}
          </DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <LoadingSpinner />
          </div>
        ) : (
        <div className="py-4 space-y-4">
          <div>
            <h3 className="font-medium mb-2">Name</h3>
            <p className="text-gray-900 font-semibold">{detail.assignment_name}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-gray-600">{detail.description}</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Content</h3>
            {detail.assignment_url ? (
              <pre className="bg-gray-100 rounded p-4 max-h-96 overflow-auto text-sm whitespace-pre-wrap">
                {detail.assignment_url}
              </pre>
            ) : (
              <span className="text-gray-400">No content</span>
            )}
          </div>
          <div>
            <h3 className="font-medium mb-2">Created At</h3>
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Calendar className="h-3 w-3" />
              {detail.created_at ? new Date(detail.created_at).toLocaleString() : "-"}
            </div>
          </div>
        </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
