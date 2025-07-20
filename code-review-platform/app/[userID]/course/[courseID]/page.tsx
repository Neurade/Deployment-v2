"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useCourses } from "@/features/courses/hooks/useCourses"
import { CourseService } from "@/features/courses/services/courseService"
// import { useAssignments } from "@/features/"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Github, Calendar, Users, FileText, GitPullRequest, Trash } from "lucide-react"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Assignment, Course } from "@/features/courses/types/index"
export default function CourseDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const userId = Number.parseInt(params.userID as string)
  const courseId = Number.parseInt(params.courseID as string)

  const { currentCourse, assignments, pullRequests, loading, error, fetchCourse, setCurrentCourse, setCourses } = useCourses(userId)
  const [showGeneralAnswer, setShowGeneralAnswer] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [assignmentForm, setAssignmentForm] = useState({
    assignment_name: "",
    description: "",
    assignment_file: null as File | null,
  })
  const [assignmentErrors, setAssignmentErrors] = useState<Record<string, string>>({})
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [showAssignmentDetailModal, setShowAssignmentDetailModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [assignmentDetailLoading, setAssignmentDetailLoading] = useState(false);
  // Add state for general answer modal
  const [showGeneralAnswerModal, setShowGeneralAnswerModal] = useState(false);

  // Add state for edit course modal
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [courseForm, setCourseForm] = useState({
    course_name: "",
    github_url: "",
    auto_grade: false,
    general_answer: ""
  });
  const [courseUpdateLoading, setCourseUpdateLoading] = useState(false);
  const [courseUpdateError, setCourseUpdateError] = useState<string | null>(null);

  // State for delete confirmation
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [assignmentToDelete, setAssignmentToDelete] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Add state for course deletion
  const [showDeleteCourseConfirmation, setShowDeleteCourseConfirmation] = useState(false);
  const [deleteCourseLoading, setDeleteCourseLoading] = useState(false);
  const [deleteCourseError, setDeleteCourseError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (courseId) {
      fetchCourse(courseId)
    }
  }, [courseId, fetchCourse])

  // Populate form data when opening edit modal
  useEffect(() => {
    if (currentCourse && showEditCourseModal) {
      setCourseForm({
        course_name: currentCourse.course_name || "",
        github_url: currentCourse.github_url || "",
        auto_grade: currentCourse.auto_grade || false,
        general_answer: currentCourse.general_answer || ""
      });
    }
  }, [currentCourse, showEditCourseModal]);

  // Add this function to handle assignment creation
  const handleAssignmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    
    // Validate assignment name
    if (!assignmentForm.assignment_name.trim()) {
      errors.assignment_name = "Assignment name is required";
    }
    
    // Validate file presence
    if (!assignmentForm.assignment_file) {
      errors.assignment_file = "Assignment file is required";
    } else {
      // Double-check file type
      const fileName = assignmentForm.assignment_file.name.toLowerCase();
      if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
        errors.assignment_file = "Only .md and .txt files are allowed";
      }
    }
    
    // If there are errors, show them and stop submission
    if (Object.keys(errors).length > 0) {
      setAssignmentErrors(errors);
      return;
    }
    
    setAssignmentLoading(true)
    try {
      // Make sure the file is not null before passing it
      if (!assignmentForm.assignment_file) {
        throw new Error("Assignment file is required");
      }
      
      // Use CourseService to create assignment (uses axios)
      await CourseService.createAssignment({
        course_id: courseId,
        assignment_name: assignmentForm.assignment_name,
        description: assignmentForm.description,
        assignment_file: assignmentForm.assignment_file, // Now TypeScript knows this is not null
      })
      setShowAssignmentModal(false)
      setAssignmentForm({ assignment_name: "", description: "", assignment_file: null })
      fetchCourse(courseId)
    } catch (err: any) {
      setAssignmentErrors({ general: err.message || "Failed to create assignment" })
    } finally {
      setAssignmentLoading(false)
    }
  }

  // Add this function to handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    // Clear previous errors
    if (assignmentErrors.assignment_file) {
      setAssignmentErrors(prev => ({ ...prev, assignment_file: "" }));
    }
    
    // Validate file type
    if (file) {
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.md') && !fileName.endsWith('.txt')) {
        setAssignmentErrors(prev => ({ 
          ...prev, 
          assignment_file: "Only .md and .txt files are allowed" 
        }));
        // Reset the file input
        e.target.value = '';
        setAssignmentForm(prev => ({ ...prev, assignment_file: null }));
        return;
      }
    }
    
    // Set the file in form state
    setAssignmentForm(prev => ({ ...prev, assignment_file: file }));
  };

  // Add this function to handle course updates
  const handleCourseUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCourseUpdateLoading(true);
    setCourseUpdateError(null);
    
    try {
      // Create courseData with the form fields, explicitly excluding dates
      const courseData = {
        course_name: courseForm.course_name,
        github_url: courseForm.github_url,
        auto_grade: courseForm.auto_grade,
        general_answer: courseForm.general_answer
      };
      
      // Send only the fields we want to update
      await CourseService.updateCourse(courseId, courseData as any);
      
      setShowEditCourseModal(false);
      
      // Only update if we have a current course
      if (currentCourse) {
        // Make sure to properly type the updated course
        const updatedCourse: Course = {
          ...currentCourse,
          course_name: courseForm.course_name,
          github_url: courseForm.github_url,
          auto_grade: courseForm.auto_grade,
          general_answer: courseForm.general_answer,
          updated_at: new Date().toISOString()
        };
        
        // Update the course in local state
        setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));
        setCurrentCourse(updatedCourse);
      } else {
        // If no current course, refresh from server
        fetchCourse(courseId);
      }
      
    } catch (err: any) {
      setCourseUpdateError(err.message || "Failed to update course");
    } finally {
      setCourseUpdateLoading(false);
    }
  };

  // Add this function to handle assignment deletion
  const handleAssignmentDelete = async (assignmentId: number) => {
    if (confirm("Are you sure you want to delete this assignment?")) {
      try {
        await CourseService.deleteAssignment(assignmentId);
        fetchCourse(courseId); // Refresh course data
      } catch (err: any) {
        alert(err.message || "Failed to delete assignment");
      }
    }
  };

  // Function to handle actual deletion
  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete) return;
    
    setDeleteLoading(true);
    setDeleteError(null);
    
    try {
      await CourseService.deleteAssignment(assignmentToDelete);
      setShowDeleteConfirmation(false);
      setAssignmentToDelete(null);
      
      // Close detail modal if open
      if (showAssignmentDetailModal) {
        setShowAssignmentDetailModal(false);
      }
      
      // Refresh assignments list
      fetchCourse(courseId);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete assignment");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Function to handle course deletion
  const handleDeleteCourse = async () => {
    setDeleteCourseLoading(true);
    setDeleteCourseError(null);
    
    try {
      await CourseService.deleteCourse(courseId);
      // Redirect to courses page after successful deletion
      router.push(`/${userId}/course`);
    } catch (err: any) {
      setDeleteCourseError(err.message || "Failed to delete course");
    } finally {
      setDeleteCourseLoading(false);
    }
  };

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
          <Button onClick={() => fetchCourse(courseId)}>Retry</Button>
        </div>
      </DashboardLayout>
    )
  }

  if (!currentCourse) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">Course not found</p>
          <Link href={`/${userId}/course`}>
            <Button>Back to Courses</Button>
          </Link>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-start">
          <div>
            {/* <Link href={`/${userId}/course`}>
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Courses
              </Button>
            </Link> */}
            <h1 className="text-3xl font-bold text-gray-900">{currentCourse.course_name}</h1>
            {/* <p className="text-gray-600 mt-2">Course details and assignments</p> */}
          </div>
          <div className="flex gap-3">
            <Dialog open={showAssignmentModal} onOpenChange={setShowAssignmentModal}>
              {/* <DialogTrigger asChild>
                <Button onClick={() => setShowAssignmentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger> */}
              <DialogContent className="max-w-5xl w-full min-h-[60vh]">
                <DialogHeader>
                  <DialogTitle>Create Assignment</DialogTitle>
                  <DialogDescription>Fill in the details for the new assignment.</DialogDescription>
                </DialogHeader>
                {assignmentErrors.general && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
                    {assignmentErrors.general}
                  </div>
                )}
                <form onSubmit={handleAssignmentSubmit} className="space-y-4">
                  <Input
                    label="Assignment Name"
                    name="assignment_name"
                    value={assignmentForm.assignment_name}
                    onChange={e => setAssignmentForm(f => ({ ...f, assignment_name: e.target.value }))}
                    error={assignmentErrors.assignment_name}
                    required
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    name="description"
                    value={assignmentForm.description}
                    onChange={e => setAssignmentForm(f => ({ ...f, description: e.target.value }))}
                  />
                  <div className="space-y-2">
                    <label htmlFor="assignment_file" className="text-sm font-medium">
                      Assignment File
                    </label>
                    <input
                      id="assignment_file"
                      type="file"
                      accept=".md,.txt"
                      onChange={handleFileChange}
                      className="w-full border rounded px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Only Markdown (.md) or text (.txt) files are accepted
                    </p>
                    {assignmentErrors.assignment_file && (
                      <p className="text-sm text-red-600">{assignmentErrors.assignment_file}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button type="submit" loading={assignmentLoading} disabled={assignmentLoading}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Assignment
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Course Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Information</CardTitle>
                <CardDescription>
                  Basic details about this course
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Github className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Repository:</span>
                  <a 
                    href={currentCourse.github_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {currentCourse.github_url}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">Created:</span>
                  <span className="text-sm">
                    {new Date(currentCourse.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Auto Grade:</span>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-full",
                    currentCourse.auto_grade ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  )}>
                    {currentCourse.auto_grade ? "Enabled" : "Disabled"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* General Answer Toggle Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>General Answer</CardTitle>
                  <CardDescription>
                    Instructions and guidelines for this course
                  </CardDescription>
                </div>
                <Button size="sm" variant="outline" onClick={() => setShowGeneralAnswerModal(true)}>
                  View General Answer
                </Button>
              </CardHeader>
            </Card>

            {/* Assignments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Assignments</CardTitle>
                  <Button size="sm" onClick={() => setShowAssignmentModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Assignment
                  </Button>
                </div>
                <CardDescription>
                  Manage course assignments and submissions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
                    <Button onClick={() => setShowAssignmentModal(true)}>Create Assignment</Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-900">{assignment.assignment_name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                              <span>Created: {new Date(assignment.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                setAssignmentDetailLoading(true);
                                setShowAssignmentDetailModal(true);
                                try {
                                  const assignmentDetail = await CourseService.getAssignment(assignment.id);
                                  setSelectedAssignment(assignmentDetail);
                                } finally {
                                  setAssignmentDetailLoading(false);
                                }
                              }}
                            >
                              View Details
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              onClick={() => {
                                setAssignmentToDelete(assignment.id);
                                setShowDeleteConfirmation(true);
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
          </div>

          {/* Course Stats */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-500">Students</p>
                    <p className="font-medium">{pullRequests.length}</p>
                  </div>
                </div> */}
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-500">Assignments</p>
                    <p className="font-medium">{assignments.length}</p>
                  </div>
                </div>
                {/* Removed pull request stats and table as per requirements */}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowAssignmentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start mt-4"
                  onClick={() => router.push(`/${userId}/course/${courseId}/pullrequest`)}
                >
                  <Github className="h-4 w-4 mr-2" />
                  View Pull Requests
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  onClick={() => setShowEditCourseModal(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Edit Course
                </Button>
                {/* Add Delete Course button */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 hover:text-red-800 hover:bg-red-50" 
                  onClick={() => setShowDeleteCourseConfirmation(true)}
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete Course
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Pull Requests Table */}
        {/* Removed as per edit hint */}

      <Dialog open={showAssignmentDetailModal} onOpenChange={setShowAssignmentDetailModal}>
        <DialogContent className="max-w-5xl w-full min-h-[60vh]">
          <DialogHeader>
            <div className="flex justify-between items-center w-full">
              <DialogTitle>Assignment Details</DialogTitle>
              
            </div>
            <DialogDescription>Details of the selected assignment.</DialogDescription>
          </DialogHeader>
          {assignmentDetailLoading ? (
            <div>Loading...</div>
          ) : selectedAssignment ? (
            <div>
              <p><strong>Name:</strong> {selectedAssignment.assignment_name}</p>
              <p><strong>Description:</strong> {selectedAssignment.description}</p>
              <p><strong>Content:</strong></p>
              {selectedAssignment.assignment_url ? (
                <div className="max-h-[60vh] min-h-[60vh] overflow-auto bg-gray-50 p-4 rounded-md relative">
                  <pre className="whitespace-pre-wrap break-all text-sm text-gray-700">{selectedAssignment.assignment_url}</pre>
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute top-2 right-2"
                    onClick={() => navigator.clipboard.writeText(selectedAssignment.assignment_url)}
                    type="button"
                  >
                    Copy
                  </Button>
                </div>
              ) : (
                <span>No file/content</span>
              )}

              <p><strong>Created:</strong> {new Date(selectedAssignment.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <div>No assignment found.</div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showGeneralAnswerModal} onOpenChange={setShowGeneralAnswerModal}>
        <DialogContent className="max-w-5xl w-full min-h-[60vh]">
          <DialogHeader>
            <DialogTitle>General Answer</DialogTitle>
            <DialogDescription>General answer content for this course.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] min-h-[60vh] overflow-auto bg-gray-50 p-4 rounded-md">
            <pre className="whitespace-pre-wrap break-all text-sm text-gray-700">{currentCourse.general_answer}</pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={showEditCourseModal} onOpenChange={setShowEditCourseModal}>
        <DialogContent className="max-w-5xl w-full">
          <DialogHeader>
            <DialogTitle>Edit Course</DialogTitle>
            <DialogDescription>Update course information</DialogDescription>
          </DialogHeader>
          {courseUpdateError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
              {courseUpdateError}
            </div>
          )}
          <form onSubmit={handleCourseUpdate} className="space-y-4">
            <Input
              label="Course Name"
              name="course_name"
              value={courseForm.course_name}
              onChange={e => setCourseForm(f => ({ ...f, course_name: e.target.value }))}
              required
            />
            <Input
              label="GitHub Repository URL"
              name="github_url"
              value={courseForm.github_url}
              onChange={e => setCourseForm(f => ({ ...f, github_url: e.target.value }))}
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="auto_grade"
                checked={courseForm.auto_grade}
                onChange={e => setCourseForm(f => ({ ...f, auto_grade: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300"
              />
              <label htmlFor="auto_grade" className="text-sm font-medium">
                Enable Auto Grade
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">General Answer</label>
              <Textarea
                placeholder="General answer content"
                name="general_answer"
                value={courseForm.general_answer}
                onChange={e => setCourseForm(f => ({ ...f, general_answer: e.target.value }))}
                className="mt-1 h-40"
              />
            </div>
            <DialogFooter>
              <Button type="submit" loading={courseUpdateLoading} disabled={courseUpdateLoading}>
                Update Course
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this assignment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {deleteError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
              {deleteError}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteConfirmation(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAssignment}
              loading={deleteLoading}
              disabled={deleteLoading}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Course Confirmation Dialog */}
      <Dialog open={showDeleteCourseConfirmation} onOpenChange={setShowDeleteCourseConfirmation}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Course</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this course? This action cannot be undone. All assignments and associated data will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          {deleteCourseError && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md mb-2">
              {deleteCourseError}
            </div>
          )}
          
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteCourseConfirmation(false)}
              disabled={deleteCourseLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteCourse}
              loading={deleteCourseLoading}
              disabled={deleteCourseLoading}
            >
              Delete Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
  )
}
