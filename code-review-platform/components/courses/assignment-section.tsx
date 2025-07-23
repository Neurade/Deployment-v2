"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText } from "lucide-react"
import { CreateAssignmentModal } from "@/components/courses/create-assignment-modal"
import { AssignmentDetailModal } from "@/components/courses/assignment-detail-modal"
import { DeleteConfirmationModal } from "@/components/courses/delete-confirmation-modal"
import { courseService } from "@/services/course.service"
import { useToast } from "@/hooks/use-toast"
import type { Assignment } from "@/types/assignment"
import { assignmentService } from "@/services/assignment.service"

interface AssignmentSectionProps {
  courseId: number
  assignments: Assignment[]
  onRefetch: () => void
}

export function AssignmentSection({ courseId, assignments, onRefetch }: AssignmentSectionProps) {
  const { toast } = useToast()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const handleViewDetails = async (assignment: Assignment) => {
    setDetailLoading(true)
    setShowDetailModal(true)
    try {
      const assignmentDetail = await assignmentService.getAssignment(assignment.id)
      setSelectedAssignment(assignmentDetail)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load assignment details",
        variant: "destructive",
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDeleteAssignment = async (assignmentId: number) => {
    try {
      await assignmentService.deleteAssignment(assignmentId)
      setShowDeleteModal(false)
      setAssignmentToDelete(null)
      if (showDetailModal) {
        setShowDetailModal(false)
      }
      onRefetch()
      toast({
        title: "Success",
        description: "Assignment deleted successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete assignment",
        variant: "destructive",
      })
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assignments</CardTitle>
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Assignment
            </Button>
          </div>
          <CardDescription>Manage course assignments and submissions</CardDescription>
        </CardHeader>
        <CardContent>
          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
              <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
              <Button onClick={() => setShowCreateModal(true)}>Create Assignment</Button>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">{assignment.assignment_name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewDetails(assignment)}>
                        View Details
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 bg-transparent"
                        onClick={() => {
                          setAssignmentToDelete(assignment.id)
                          setShowDeleteModal(true)
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreateAssignmentModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => {
          setShowCreateModal(false)
          onRefetch()
        }}
        courseId={courseId}
      />

      <AssignmentDetailModal
        open={showDetailModal}
        onOpenChange={setShowDetailModal}
        assignment={selectedAssignment}
        onDelete={(id: number) => {
          setAssignmentToDelete(id)
          setShowDeleteModal(true)
        }}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => { if (assignmentToDelete) handleDeleteAssignment(assignmentToDelete) }}
        title="Delete Assignment"
        description="Are you sure you want to delete this assignment? This action cannot be undone."
      />
    </>
  )
}
